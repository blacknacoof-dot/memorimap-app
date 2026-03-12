import { useState, useEffect } from 'react';
import { useSession } from '../../lib/auth';
import { getFacilitySubscription, Consultation } from '../../lib/queries';
import { getAuthClient } from '../../lib/supabaseClient';
import { Reservation } from '../../types';
import type { SangjoContract } from '../../types/sangjo';
import type { Subscription, Payment } from '../../types/db';
import { toast } from 'sonner';

export type ActivePartnerTab = 'overview' | 'chat' | 'ops' | 'consultations' | 'reservations' | 'revenue' | 'settings';

function mapSangjoContractToConsultation(sc: SangjoContract): Consultation {
  const statusMap: Record<string, Consultation['status']> = {
    '상담신청': 'pending', '예약대기': 'waiting',
    '계약진행': 'accepted', '임종발생': 'accepted', '현장도착': 'accepted',
    '염습중': 'accepted', '장례식진행': 'accepted', '완료': 'completed',
  };
  return {
    id: sc.id,
    facility_id: sc.sangjo_id,
    user_name: sc.customer_name || '',
    user_phone: sc.customer_phone || '',
    urgency: sc.emergency_level || 'normal',
    scale: '', religion: sc.religion || '', schedule: sc.preferred_call_time || '',
    status: statusMap[sc.status] || 'pending',
    notes: [
      sc.contract_number ? `계약번호: ${sc.contract_number}` : '',
      sc.preferred_call_time ? `희망시간: ${sc.preferred_call_time}` : '',
      sc.application_type === 'CONSULTATION' ? '유형: 상담신청' : '유형: 계약신청',
    ].filter(Boolean).join(' | '),
    created_at: sc.created_at, updated_at: sc.created_at,
    is_read: sc.status !== '상담신청',
    is_ai_response: false, metadata: {}, source: 'sangjo_contract',
  };
}

export function usePartnerDashboard(partnerId: string) {
  const [activeTab, setActiveTab] = useState<ActivePartnerTab>('consultations');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [partnerName, setPartnerName] = useState('상조 파트너');
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [isSangjo, setIsSangjo] = useState(false);
  const { session } = useSession();

  useEffect(() => {
    if (!session) return;
    const fetchPartner = async () => {
      const client = await getAuthClient(session, { strict: true });
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partnerId);

      if (isUUID) {
        setFacilityId(partnerId);
        const { data: facility } = await client.from('facilities').select('name, type').eq('id', partnerId).maybeSingle();
        if (facility?.name) {
          setPartnerName(facility.name);
          setIsSangjo(facility.type === 'sangjo');
          return;
        }
        const { data: fc } = await client.from('funeral_companies').select('name').eq('id', partnerId).maybeSingle();
        if (fc?.name) { setPartnerName(fc.name); setIsSangjo(true); return; }
      }

      const { data } = await client.from('partners').select('name').eq('id', partnerId).maybeSingle();
      let name = data?.name;

      if (!name) {
        const { data: hqData } = await client.from('sangjo_hq_admins').select('company_name, sangjo_id').eq('sangjo_id', partnerId).limit(1).maybeSingle();
        if (hqData) name = hqData.company_name;
      }
      if (name) setPartnerName(name);

      if (!isUUID) {
        const { data: hqLink } = await client.from('sangjo_hq_admins').select('sangjo_id').eq('sangjo_id', partnerId).limit(1).maybeSingle();
        if (hqLink?.sangjo_id) setFacilityId(hqLink.sangjo_id);
      }
    };
    fetchPartner();
  }, [partnerId, session]);

  useEffect(() => {
    if (!facilityId) return;

    const loadFacilityData = async () => {
      try {
        const client = await getAuthClient(session, { strict: true });
        const [consResult, resResult, subData, contractsResult] = await Promise.all([
          client.from('consultations').select('*').eq('facility_id', facilityId).order('created_at', { ascending: false }),
          client.from('reservations').select('*').eq('facility_id', facilityId).order('created_at', { ascending: false }),
          getFacilitySubscription(facilityId, client),
          client.from('sangjo_contracts').select('*').eq('sangjo_id', facilityId).order('created_at', { ascending: false }),
        ]);
        const dbConsultations = (consResult.data || []) as Consultation[];
        const mappedContracts = (contractsResult.data || []).map((sc: SangjoContract) => mapSangjoContractToConsultation(sc));
        const merged = [...dbConsultations, ...mappedContracts].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setConsultations(merged);
        if (resResult.data) setReservations(resResult.data as Reservation[]);
        if (subData) {
          setSubscription(subData);
          const { data: payData } = await client.from('subscription_payments').select('*').eq('subscription_id', subData.id).order('paid_at', { ascending: false });
          if (payData) setPayments(payData);
        }
      } catch {
        toast.error('데이터를 불러오지 못했습니다.');
      }
    };
    loadFacilityData();

    let mounted = true;
    let cleanup: (() => void) | undefined;

    getAuthClient(session).then(client => {
      if (!mounted) return;
      const consChannel = client.channel(`partner-cons-${facilityId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'consultations', filter: `facility_id=eq.${facilityId}` }, (payload) => {
          if (payload.eventType === 'INSERT') { setConsultations(prev => [payload.new as Consultation, ...prev]); toast.info('새 상담 문의가 접수되었습니다.'); }
          else if (payload.eventType === 'UPDATE') { setConsultations(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c)); }
        }).subscribe();

      const resChannel = client.channel(`partner-res-${facilityId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `facility_id=eq.${facilityId}` }, (payload) => {
          if (payload.eventType === 'INSERT') { setReservations(prev => [payload.new as Reservation, ...prev]); toast.info('새 예약이 접수되었습니다.'); }
          else if (payload.eventType === 'UPDATE') { setReservations(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r)); }
        }).subscribe();

      const contractChannel = client.channel(`partner-contracts-${facilityId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sangjo_contracts', filter: `sangjo_id=eq.${facilityId}` }, (payload) => {
          const mapped = mapSangjoContractToConsultation(payload.new as SangjoContract);
          if (payload.eventType === 'INSERT') { setConsultations(prev => [mapped, ...prev]); toast.info('새 상조 상담 신청이 접수되었습니다.'); }
          else if (payload.eventType === 'UPDATE') { setConsultations(prev => prev.map(c => c.id === (payload.new as SangjoContract).id ? mapped : c)); }
        }).subscribe();

      cleanup = () => {
        consChannel.unsubscribe(); resChannel.unsubscribe(); contractChannel.unsubscribe();

      };
    });

    return () => { mounted = false; cleanup?.(); };
  }, [facilityId, session]);

  const unreadConsultations = consultations.filter(c => !c.is_read).length;
  const pendingReservations = reservations.filter(r => r.status === 'pending' || r.status === 'urgent').length;

  return {
    activeTab, setActiveTab,
    isSidebarOpen, setIsSidebarOpen,
    partnerName, facilityId,
    consultations, setConsultations,
    reservations, setReservations,
    subscription, payments,
    showPlanSelector, setShowPlanSelector,
    isSangjo,
    session,
    unreadConsultations, pendingReservations,
  };
}
