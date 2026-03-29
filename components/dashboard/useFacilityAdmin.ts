import { useState, useEffect } from 'react';
import { useSession } from '../../lib/auth';
import { Reservation, Facility } from '../../types';
import { approveReservation, rejectReservation, getFacilitySubscription, Consultation } from '../../lib/queries';
import { getAuthClient } from '../../lib/supabaseClient';
import { confirmAsync, promptAsync } from '../../src/components/common/ConfirmModal';
import { toast } from 'sonner';

interface SubscriptionInfo {
  plan_name?: string;
  plan_price?: number;
  next_billing_date?: string;
  status?: string;
  [key: string]: unknown;
}

interface UseFacilityAdminProps {
  user: { id: string; name: string; email: string; imageUrl?: string } | null;
  facilities: Facility[];
}

export function useFacilityAdmin({ user, facilities }: UseFacilityAdminProps) {
  const [myFacilityId, setMyFacilityId] = useState<string | null>(null);
  const [fetchedFacility, setFetchedFacility] = useState<Facility | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'cancelled' | 'faq' | 'consultations'>('pending');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const { session } = useSession();

  useEffect(() => {
    if (user?.id) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadData() {
    if (!user) return;
    setIsLoading(true);
    try {
      const client = await getAuthClient(session, { strict: true });
      const { data: facilityArr } = await client
        .from('facilities').select('id').eq('user_id', user.id).limit(1);
      const facilityId = facilityArr?.[0]?.id || null;
      setMyFacilityId(facilityId);

      if (facilityId) {
        const foundInProps = facilities.find(f => f.id === facilityId);
        const { getFacility } = await import('../../lib/queries');
        const freshFacility = await getFacility(facilityId);
        setFetchedFacility(freshFacility ?? foundInProps ?? null);

        const { data: resData } = await client
          .from('reservations').select('*').eq('facility_id', facilityId).order('created_at', { ascending: false });
        const res = (resData || []) as Reservation[];
        res.sort((a, b) => new Date(b.visit_date ?? 0).getTime() - new Date(a.visit_date ?? 0).getTime());
        setReservations(res);

        const sub = await getFacilitySubscription(facilityId, client);
        setSubscription(sub);

        // 전통 상담 (consultations)
        const { data: consData, error: consError } = await client
          .from('consultations').select('*').eq('facility_id', facilityId).order('created_at', { ascending: false });
        if (consError) toast.error('상담 목록 로딩 실패');
        const legacyList = (consData || []) as Consultation[];

        // AI 상담 (ai_consultations) — 시설관리자도 조회 가능
        let aiAdapted: Consultation[] = [];
        try {
          const { data: aiData } = await client
            .from('ai_consultations').select('*')
            .eq('facility_id', facilityId)
            .not('status', 'eq', 'deleted')
            .order('created_at', { ascending: false });
          if (aiData) {
            aiAdapted = (aiData as Array<Record<string, unknown>>).map((ai) => ({
              id: String(ai.id),
              facility_id: String(ai.facility_id || ''),
              facility_name: String(ai.facility_name || ''),
              user_id: String(ai.user_id || ''),
              status: ai.status === 'completed' ? 'completed'
                : ai.status === 'cancelled' ? 'cancelled' : 'waiting',
              created_at: String(ai.created_at || ''),
              updated_at: String(ai.updated_at || ''),
              scale: 'small',
              religion: 'none',
              schedule: '3day',
              urgency: 'inquiry',
              is_read: false,
              is_ai_response: true,
              source: 'ai',
              metadata: (ai.metadata || {}) as Record<string, unknown>,
            })) as unknown as Consultation[];
          }
        } catch { /* ai_consultations 조회 실패 시 빈 배열 유지 */ }

        // 리드 (leads) — 상담 폼/AI 추천에서 생성된 리드
        let leadsAdapted: Consultation[] = [];
        try {
          const { data: leadsData } = await client
            .from('leads').select('*')
            .eq('facility_id', facilityId)
            .order('created_at', { ascending: false });
          if (leadsData) {
            leadsAdapted = (leadsData as Array<Record<string, unknown>>).map((lead) => ({
              id: String(lead.id),
              facility_id: String(lead.facility_id || ''),
              facility_name: '',
              user_id: String(lead.user_id || ''),
              user_name: String(lead.contact_name || ''),
              user_phone: String(lead.contact_phone || ''),
              status: lead.status === 'completed' ? 'completed'
                : lead.status === 'cancelled' ? 'cancelled' : 'pending',
              created_at: String(lead.created_at || ''),
              updated_at: String(lead.updated_at || lead.created_at || ''),
              notes: String(
                (lead.context_data as Record<string, unknown>)?.notes
                || (lead.context_data as Record<string, unknown>)?.source
                || `[${lead.category || ''}] ${lead.urgency || ''}`
              ),
              scale: String(lead.scale || 'small'),
              religion: 'none',
              schedule: '3day',
              urgency: String(lead.urgency || 'inquiry'),
              is_read: false,
              is_ai_response: false,
              source: 'lead',
              metadata: (lead.context_data || {}) as Record<string, unknown>,
            })) as unknown as Consultation[];
          }
        } catch { /* leads 조회 실패 시 빈 배열 유지 */ }

        // 병합 후 최신순 정렬
        const merged = [...aiAdapted, ...leadsAdapted, ...legacyList]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setConsultations(merged);
      } else {
        toast.error('관리 중인 시설이 없습니다.');
      }
    } catch {
      toast.error('시설 데이터 로딩 실패');
    } finally {
      setIsLoading(false);
    }
  }

  // Realtime Subscription
  useEffect(() => {
    if (!myFacilityId || !session) return;
    let mounted = true;
    let cleanup: (() => void) | undefined;

    getAuthClient(session).then(client => {
      if (!mounted) return;
      const consultationChannel = client.channel(`facility-cons-${myFacilityId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'consultations', filter: `facility_id=eq.${myFacilityId}` },
          (payload) => {
            if (payload.eventType === 'INSERT') setConsultations(prev => [payload.new as Consultation, ...prev]);
            else if (payload.eventType === 'UPDATE') {
              setConsultations(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
            }
          })
        .subscribe();

      const reservationChannel = client.channel(`facility-res-${myFacilityId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `facility_id=eq.${myFacilityId}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newRes: Reservation = {
                id: payload.new.id, facility_id: payload.new.facility_id,
                facility_name: payload.new.facility_name, visit_date: payload.new.visit_date,
                time_slot: payload.new.time_slot,
                visitor_name: payload.new.user_name || payload.new.visitor_name,
                visitor_count: payload.new.visitor_count || 1,
                contact_number: payload.new.contact_number || payload.new.user_phone,
                purpose: payload.new.purpose || '상담 및 방문',
                status: payload.new.status as Reservation['status'],
                payment_amount: payload.new.payment_amount || 0,
                paid_at: payload.new.paid_at, user_id: payload.new.user_id, ...payload.new,
              };
              setReservations(prev => [newRes, ...prev]);
              if (newRes.status === 'urgent') toast.error('🚨 신규 긴급 예약이 접수되었습니다!', { duration: 6000 });
            } else if (payload.eventType === 'UPDATE') {
              setReservations(prev => prev.map(r =>
                r.id === payload.new.id ? {
                  ...r, ...payload.new,
                  facility_id: payload.new.facility_id, facility_name: payload.new.facility_name,
                  visit_date: payload.new.visit_date, time_slot: payload.new.time_slot,
                  visitor_name: payload.new.user_name || payload.new.visitor_name,
                  visitor_count: payload.new.visitor_count || 1,
                  contact_number: payload.new.contact_number || payload.new.user_phone,
                  status: payload.new.status as Reservation['status'],
                } : r
              ));
            }
          })
        .subscribe();

      const aiConsultationChannel = client.channel(`facility-ai-cons-${myFacilityId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_consultations', filter: `facility_id=eq.${myFacilityId}` },
          (payload) => {
            const ai = payload.new as Record<string, unknown>;
            const adapted: Consultation = {
              id: String(ai.id),
              facility_id: String(ai.facility_id || ''),
              facility_name: String(ai.facility_name || ''),
              user_id: String(ai.user_id || ''),
              status: 'waiting',
              created_at: String(ai.created_at || ''),
              updated_at: String(ai.updated_at || ''),
              scale: 'small', religion: 'none', schedule: '3day', urgency: 'inquiry',
              is_read: false, is_ai_response: true, source: 'ai',
              metadata: (ai.metadata || {}) as Record<string, unknown>,
            } as unknown as Consultation;
            setConsultations(prev => [adapted, ...prev]);
          })
        .subscribe();

      const leadsChannel = client.channel(`facility-leads-${myFacilityId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `facility_id=eq.${myFacilityId}` },
          (payload) => {
            const lead = payload.new as Record<string, unknown>;
            const adapted: Consultation = {
              id: String(lead.id),
              facility_id: String(lead.facility_id || ''),
              facility_name: '',
              user_id: String(lead.user_id || ''),
              user_name: String(lead.contact_name || ''),
              user_phone: String(lead.contact_phone || ''),
              status: 'pending',
              created_at: String(lead.created_at || ''),
              updated_at: String(lead.updated_at || lead.created_at || ''),
              notes: String(
                (lead.context_data as Record<string, unknown>)?.notes
                || (lead.context_data as Record<string, unknown>)?.source
                || `[${lead.category || ''}] ${lead.urgency || ''}`
              ),
              scale: String(lead.scale || 'small'),
              religion: 'none', schedule: '3day',
              urgency: String(lead.urgency || 'inquiry'),
              is_read: false, is_ai_response: false, source: 'lead',
              metadata: (lead.context_data || {}) as Record<string, unknown>,
            } as unknown as Consultation;
            setConsultations(prev => [adapted, ...prev]);
          })
        .subscribe();

      cleanup = () => {
        consultationChannel.unsubscribe();
        aiConsultationChannel.unsubscribe();
        reservationChannel.unsubscribe();
        leadsChannel.unsubscribe();
      };
    });

    return () => { mounted = false; cleanup?.(); };
  }, [myFacilityId, session]);

  async function handleApprove(reservationId: string) {
    if (!await confirmAsync('이 예약을 승인하시겠습니까?')) return;
    try {
      const client = await getAuthClient(session, { strict: true });
      await approveReservation(reservationId, client);
      setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status: 'confirmed' as const } : r));
      setSelectedReservation(null);
      toast.success('예약이 승인되었습니다.');
    } catch {
      toast.error('예약 승인 중 오류가 발생했습니다.');
    }
  }

  async function handleReject(reservationId: string, preReason?: string) {
    let reason: string | null;
    if (preReason !== undefined) {
      reason = preReason;
    } else {
      reason = await promptAsync('거절 사유를 입력해주세요', '예약 거절', { placeholder: '거절 사유 (선택)' });
      if (reason === null) return;
    }
    try {
      const client = await getAuthClient(session, { strict: true });
      await rejectReservation(reservationId, reason || undefined, client);
      setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status: 'rejected' as const } : r));
      setSelectedReservation(null);
      toast.success('예약이 거절되었습니다.');
    } catch {
      toast.error('예약 거절 중 오류가 발생했습니다.');
    }
  }

  async function handleAnswerConsultation(id: string, text: string) {
    try {
      const client = await getAuthClient(session, { strict: true });
      const { error } = await client.from('consultations')
        .update({ answer: text, answered_at: new Date().toISOString(), status: 'accepted', is_read: true }).eq('id', id);
      if (!error) {
        setConsultations(prev => prev.map(c =>
          c.id === id ? { ...c, answer: text, answered_at: new Date().toISOString(), status: 'accepted', is_read: true } : c
        ));
        toast.success('답변이 전송되었습니다.');
      } else {
        toast.error('답변 전송 실패');
      }
    } catch {
      toast.error('답변 전송 실패');
    }
  }

  async function handleReadConsultation(id: string) {
    try {
      const client = await getAuthClient(session, { strict: true });
      await client.from('consultations').update({ is_read: true }).eq('id', id);
      setConsultations(prev => prev.map(c => c.id === id ? { ...c, is_read: true } : c));
    } catch { /* ignore */ }
  }

  const facilityFromProps = facilities.find(f => f.id === myFacilityId);
  const myFacility = (fetchedFacility && fetchedFacility.id === myFacilityId)
    ? fetchedFacility
    : facilityFromProps || fetchedFacility;
  const pendingCount = reservations.filter(r => r.status === 'pending' || r.status === 'urgent').length;
  const urgentCount = reservations.filter(r => r.status === 'urgent').length;
  const consultationCount = consultations.filter(c => !c.is_read && c.source !== 'ai' && !c.is_ai_response).length;

  return {
    myFacilityId, myFacility,
    reservations, consultations,
    isLoading, activeTab, setActiveTab,
    selectedReservation, setSelectedReservation,
    editingFacility, setEditingFacility,
    subscription,
    pendingCount, urgentCount, consultationCount,
    handleApprove, handleReject,
    handleAnswerConsultation, handleReadConsultation,
    loadData,
    session,
  };
}
