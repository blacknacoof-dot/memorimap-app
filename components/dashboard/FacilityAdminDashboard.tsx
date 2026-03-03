import React, { useEffect, useState } from 'react';
import { useSession } from '../../lib/auth';
import { Reservation, ViewState, Facility } from '../../types';
import { approveReservation, rejectReservation, getFacilitySubscription, answerConsultation, FuneralConsultation, markConsultationAsRead } from '../../lib/queries';
import { getAuthClient } from '../../lib/supabaseClient';
import ReservationManager from './facility/ReservationManager';
import { ConsultationList } from '../ConsultationList';
import { ReservationDetailModal } from '../ReservationDetailModal';
import { FacilityEditModal } from '../FacilityEditModal';
import { FacilityFAQManager } from '../FacilityFAQManager';
import { confirmAsync, promptAsync } from '../../src/components/common/ConfirmModal';
import { Loader2, CheckCircle, XCircle, Clock, ArrowLeft, Home, Edit, Building2, MapPin, Phone, ArrowRight, Siren, HelpCircle, MessageSquare, Calendar } from 'lucide-react';
import { toast } from 'sonner'; // [Phase 2] Error Handler

interface Props {
    user: { id: string; name: string; email: string; imageUrl?: string } | null;
    facilities: Facility[];
    onNavigate: (view: ViewState, context?: { facilityId?: string }) => void;
}

export const FacilityAdminDashboard: React.FC<Props> = ({ user, facilities, onNavigate }) => {
    const { session } = useSession();
    const [myFacilityId, setMyFacilityId] = useState<string | null>(null);
    const [fetchedFacility, setFetchedFacility] = useState<Facility | null>(null);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'cancelled' | 'faq' | 'consultations'>('pending');
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
    const [subscription, setSubscription] = useState<{
        plan_name?: string;
        plan_price?: number;
        next_billing_date?: string;
        status?: string;
        [key: string]: unknown;
    } | null>(null);

    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user?.id]);

    const loadData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const client = await getAuthClient(session, { strict: true });
            // loadData started

            // Get the single facility owned by this user (using auth client for RLS)
            const { data: facilityArr } = await client
                .from('facilities')
                .select('id')
                .eq('user_id', user.id)
                .limit(1);
            const facilityId = facilityArr?.[0]?.id || null;
            // facilityId resolved
            setMyFacilityId(facilityId);

            if (facilityId) {
                // [Fix] If facility is not in props, fetch it directly
                const foundInProps = facilities.find(f => f.id === facilityId);
                if (foundInProps) {
                    setFetchedFacility(foundInProps);
                } else {
                    const { getFacility } = await import('../../lib/queries');
                    const data = await getFacility(facilityId);
                    setFetchedFacility(data);
                }

                // Get reservations (using auth client)
                const { data: resData } = await client
                    .from('reservations')
                    .select('*')
                    .eq('facility_id', facilityId)
                    .order('created_at', { ascending: false });
                const res = (resData || []) as Reservation[];
                res.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
                setReservations(res);

                // Get subscription info
                const sub = await getFacilitySubscription(facilityId, client);
                setSubscription(sub);

                // Get consultations (using auth client for RLS)
                const { data: consData, error: consError } = await client
                    .from('consultations')
                    .select('*')
                    .eq('facility_id', facilityId)
                    .order('created_at', { ascending: false });
                if (consError) toast.error('상담 목록 로딩 실패');
                const cons = (consData || []) as Consultation[];
                // consultations loaded
                setConsultations(cons);
            } else {
                toast.error('관리 중인 시설이 없습니다.');
            }
        } catch (err) {
            toast.error('시설 데이터 로딩 실패');
        } finally {
            setIsLoading(false);
        }
    };

    // Realtime Subscription
    useEffect(() => {
        if (!myFacilityId || !session) return;

        // [Realtime Sync] — auth client
        let cleanup: (() => void) | undefined;

        getAuthClient(session).then(client => {
            // 1. Consultations Subscription
            const consultationChannel = client
                .channel(`facility-cons-${myFacilityId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'consultations',
                        filter: `facility_id=eq.${myFacilityId}`
                    },
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            setConsultations(prev => [payload.new as Consultation, ...prev]);
                        } else if (payload.eventType === 'UPDATE') {
                            setConsultations(prev => prev.map(c =>
                                c.id === payload.new.id ? { ...c, ...payload.new } : c
                            ));
                        }
                    }
                )
                .subscribe();

            // 2. Reservations Subscription
            const reservationChannel = client
                .channel(`facility-res-${myFacilityId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'reservations',
                        filter: `facility_id=eq.${myFacilityId}`
                    },
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            const newRes: Reservation = {
                                id: payload.new.id,
                                facility_id: payload.new.facility_id,
                                facility_name: payload.new.facility_name,
                                visit_date: payload.new.visit_date,
                                time_slot: payload.new.time_slot,
                                visitor_name: payload.new.user_name || payload.new.visitor_name,
                                visitor_count: payload.new.visitor_count || 1,
                                contact_number: payload.new.contact_number || payload.new.user_phone,
                                purpose: payload.new.purpose || '상담 및 방문',
                                status: payload.new.status as Reservation['status'],
                                payment_amount: payload.new.payment_amount || 0,
                                paid_at: payload.new.paid_at,
                                user_id: payload.new.user_id,
                                ...payload.new
                            };
                            setReservations(prev => [newRes, ...prev]);
                            if (newRes.status === 'urgent') {
                                toast.error('🚨 신규 긴급 예약이 접수되었습니다!', { duration: 6000 });
                            }
                        } else if (payload.eventType === 'UPDATE') {
                            setReservations(prev => prev.map(r =>
                                r.id === payload.new.id ? {
                                    ...r,
                                    ...payload.new,
                                    facility_id: payload.new.facility_id,
                                    facility_name: payload.new.facility_name,
                                    visit_date: payload.new.visit_date,
                                    time_slot: payload.new.time_slot,
                                    visitor_name: payload.new.user_name || payload.new.visitor_name,
                                    visitor_count: payload.new.visitor_count || 1,
                                    contact_number: payload.new.contact_number || payload.new.user_phone,
                                    status: payload.new.status as Reservation['status']
                                } : r
                            ));
                        }
                    }
                )
                .subscribe();

            cleanup = () => {
                consultationChannel.unsubscribe();
                reservationChannel.unsubscribe();
                client.removeChannel(consultationChannel);
                client.removeChannel(reservationChannel);
            };
        });

        return () => { cleanup?.(); };
    }, [myFacilityId, session]);

    const handleApprove = async (reservationId: string) => {
        if (!await confirmAsync('이 예약을 승인하시겠습니까?')) return;

        try {
            const client = await getAuthClient(session, { strict: true });
            await approveReservation(reservationId, client);
            setReservations(prev => prev.map(r =>
                r.id === reservationId ? { ...r, status: 'confirmed' as const } : r
            ));
            setSelectedReservation(null);
            toast.success('예약이 승인되었습니다.');
        } catch (err) {
            toast.error('예약 승인 중 오류가 발생했습니다.');
        }
    };

    const handleReject = async (reservationId: string) => {
        const reason = await promptAsync('거절 사유를 입력해주세요', '예약 거절', { placeholder: '거절 사유 (선택)' });
        if (reason === null) return;

        try {
            const client = await getAuthClient(session, { strict: true });
            await rejectReservation(reservationId, reason || undefined, client);
            setReservations(prev => prev.map(r =>
                r.id === reservationId ? { ...r, status: 'rejected' as const } : r
            ));
            setSelectedReservation(null);
            toast.success('예약이 거절되었습니다.');
        } catch (err) {
            toast.error('예약 거절 중 오류가 발생했습니다.');
        }
    };

    // [Fix] Use fetchedFacility as fallback if not in prop array
    const myFacility = facilities.find(f => f.id === myFacilityId) || fetchedFacility;
    const pendingCount = reservations.filter(r => r.status === 'pending' || r.status === 'urgent').length;
    const urgentCount = reservations.filter(r => r.status === 'urgent').length;
    // Unread count based on is_read flag (fallback to waiting if is_read undefined for legacy)
    const consultationCount = consultations.filter(c => !c.is_read).length;

    return (
        <div className="h-full overflow-y-auto pt-24 pb-6 px-4 bg-gray-50">
            {/* Header */}
            <div className="mb-6 flex justify-between items-start">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">업체 관리 대시보드</h1>
                    <p className="text-sm text-gray-600">
                        {myFacility ? `${myFacility.name} 관리 중` : '할당된 시설 정보를 불러오는 중...'}
                    </p>
                    {pendingCount > 0 && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                            <Clock size={16} />
                            승인 대기 중인 예약 {pendingCount}건
                            {urgentCount > 0 && <span className="ml-1 text-red-600 font-bold animate-pulse">(긴급 {urgentCount}건)</span>}
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onNavigate(ViewState.SUBSCRIPTION_PLANS, { facilityId: myFacility?.id })}
                        className="px-3 md:px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-md text-xs md:text-sm"
                    >
                        💎 구독 관리
                    </button>
                    <button
                        onClick={() => onNavigate(ViewState.MY_PAGE)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="일반 화면으로 돌아가기"
                    >
                        <Home size={24} />
                    </button>
                </div>
            </div>

            {(!subscription || !subscription.plan_name) && myFacility && (
                <div
                    onClick={() => onNavigate(ViewState.SUBSCRIPTION_PLANS, { facilityId: myFacility.id })}
                    className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white shadow-lg cursor-pointer transform transition-transform hover:scale-[1.01] flex justify-between items-center group"
                >
                    <div>
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                            💎 프리미엄 멤버십으로 업그레이드하세요!
                        </h3>
                        <p className="text-indigo-100 text-sm">무제한 AI 상담, 상위 노출 등 다양한 혜택을 누려보세요.</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                        <ArrowRight size={20} />
                    </div>
                </div>
            )}

            {/* My Facility Card */}
            {myFacility ? (
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">시설 정보</h2>
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Building2 size={18} className="text-primary" />
                                    <h3 className="font-bold text-gray-900">{myFacility.name}</h3>
                                    {(subscription?.plan_name === '프리미엄' || subscription?.plan_name?.toLowerCase() === 'premium') && (
                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold border border-purple-200">
                                            PREMIUM
                                        </span>
                                    )}
                                    {(subscription?.plan_name === '엔터프라이즈' || subscription?.plan_name?.toLowerCase() === 'enterprise') && (
                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                                            ENTERPRISE
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} />
                                        <span>{myFacility.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} />
                                        <span>{myFacility.phone || '전화번호 미등록'}</span>
                                    </div>
                                    {subscription?.next_billing_date && (
                                        <div className="flex items-center gap-2 text-primary font-medium mt-1">
                                            <Calendar size={14} />
                                            <span>다음 결제 예정일: {new Date(subscription.next_billing_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setEditingFacility(myFacility)}
                                className="flex flex-col items-center gap-1 px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-md active:scale-95 group"
                            >
                                <div className="flex items-center gap-2 font-bold whitespace-nowrap">
                                    <Edit size={18} />
                                    정보 수정
                                </div>
                                <span className="text-[10px] opacity-90 font-medium">사진 · 가격 · 설명 관리</span>
                            </button>
                        </div>
                    </div>
                </div>
            ) : !isLoading && (
                <div className="mb-6 p-8 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center">
                    <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">관리 중인 시설이 없습니다.</h3>
                    <p className="text-sm text-gray-500">관리자 계정으로 시설을 할당받아야 대시보드를 사용할 수 있습니다.</p>
                </div>
            )}

            {/* Stats Cards — 클릭 시 해당 탭으로 전환 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <button onClick={() => setActiveTab('pending')} className={`bg-white rounded-xl p-3 border text-left transition-all ${activeTab === 'pending' ? 'ring-2 ring-yellow-400 border-yellow-300' : 'hover:shadow-md'}`}>
                    <div className="flex items-center gap-1.5 text-yellow-600 mb-0.5">
                        <Clock size={14} />
                        <span className="text-[11px] font-medium">대기</span>
                    </div>
                    <p className="text-xl font-bold">
                        {reservations.filter(r => r.status === 'pending' || r.status === 'urgent').length}
                    </p>
                    {reservations.filter(r => r.status === 'urgent').length > 0 && (
                        <p className="text-[10px] text-red-500 font-bold mt-0.5">
                            긴급 {reservations.filter(r => r.status === 'urgent').length}건
                        </p>
                    )}
                </button>
                <button onClick={() => setActiveTab('confirmed')} className={`bg-white rounded-xl p-3 border text-left transition-all ${activeTab === 'confirmed' ? 'ring-2 ring-green-400 border-green-300' : 'hover:shadow-md'}`}>
                    <div className="flex items-center gap-1.5 text-green-600 mb-0.5">
                        <CheckCircle size={14} />
                        <span className="text-[11px] font-medium">확정</span>
                    </div>
                    <p className="text-xl font-bold">{reservations.filter(r => r.status === 'confirmed').length}</p>
                </button>
                <button onClick={() => setActiveTab('cancelled')} className={`bg-white rounded-xl p-3 border text-left transition-all ${activeTab === 'cancelled' ? 'ring-2 ring-gray-400 border-gray-300' : 'hover:shadow-md'}`}>
                    <div className="flex items-center gap-1.5 text-gray-600 mb-0.5">
                        <XCircle size={14} />
                        <span className="text-[11px] font-medium">취소</span>
                    </div>
                    <p className="text-xl font-bold">{reservations.filter(r => r.status === 'cancelled').length}</p>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-2">
                {[
                    { key: 'pending', label: '예약 대기', count: reservations.filter(r => r.status === 'pending' || r.status === 'urgent').length },
                    { key: 'consultations', label: '상담 문의', count: consultationCount, icon: MessageSquare, badge: true },
                    { key: 'confirmed', label: '확정', count: reservations.filter(r => r.status === 'confirmed').length },
                    { key: 'cancelled', label: '취소', count: reservations.filter(r => r.status === 'cancelled').length },
                    { key: 'faq', label: 'FAQ', icon: HelpCircle },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as typeof activeTab)}
                        className={`flex-shrink-0 md:flex-1 min-w-[60px] py-2 px-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1 ${activeTab === tab.key
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border'
                            }`}
                        data-testid={tab.key === 'faq' ? 'faq-tab' : undefined}
                    >
                        {tab.icon && <tab.icon size={14} />}
                        <span>{tab.label}</span>
                        {tab.badge && tab.count > 0 ? (
                            <span className="ml-0.5 w-6 h-6 bg-red-500 text-white text-xs rounded-full font-bold inline-flex items-center justify-center leading-none">
                                {tab.count}
                            </span>
                        ) : tab.count !== undefined && !tab.badge ? (
                            <span className="opacity-70">({tab.count})</span>
                        ) : null}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {activeTab === 'consultations' ? (
                <ConsultationList
                    consultations={consultations}
                    onAnswer={async (id, text) => {
                        try {
                            const client = await getAuthClient(session, { strict: true });
                            const { error } = await client
                                .from('consultations')
                                .update({ answer: text, answered_at: new Date().toISOString(), status: 'accepted', is_read: true })
                                .eq('id', id);
                            if (!error) {
                                setConsultations(prev => prev.map(c =>
                                    c.id === id ? { ...c, answer: text, answered_at: new Date().toISOString(), status: 'accepted', is_read: true } : c
                                ));
                                toast.success('답변이 전송되었습니다.');
                            } else {
                                // answer error
                                toast.error('답변 전송 실패');
                            }
                        } catch (e) {
                            // answer exception
                            toast.error('답변 전송 실패');
                        }
                    }}
                    onRead={async (id) => {
                        try {
                            const client = await getAuthClient(session, { strict: true });
                            await client
                                .from('consultations')
                                .update({ is_read: true })
                                .eq('id', id);
                            setConsultations(prev => prev.map(c =>
                                c.id === id ? { ...c, is_read: true } : c
                            ));
                        } catch (e) {
                            // markRead error
                        }
                    }}
                />
            ) : activeTab === 'faq' ? (
                <FacilityFAQManager facilityId={myFacilityId || undefined} />
            ) : isLoading ? (
                <div className="text-center py-10">
                    <Loader2 size={32} className="animate-spin text-primary mx-auto" />
                </div>
            ) : myFacilityId ? (
                <ReservationManager
                    reservations={reservations}
                    onUpdateStatus={async (id, status, reason) => {
                        if (status === 'confirmed') {
                            await handleApprove(id);
                        } else if (status === 'rejected') {
                            try {
                                const client = await getAuthClient(session, { strict: true });
                                await rejectReservation(id, reason, client);
                                setReservations(prev => prev.map(r =>
                                    r.id === id ? { ...r, status: 'rejected' as const, rejection_reason: reason || null } : r
                                ));
                                toast.success('예약이 거절되었습니다.');
                            } catch {
                                toast.error('예약 거절 중 오류가 발생했습니다.');
                            }
                        }
                    }}
                />
            ) : null}

            {/* Reservation Detail Modal with Admin Actions */}
            {selectedReservation && (
                <ReservationDetailModal
                    reservation={selectedReservation}
                    facility={facilities.find(f => f.id === selectedReservation.facility_id)}
                    onClose={() => setSelectedReservation(null)}
                    onCancel={undefined}
                    adminActions={
                        (selectedReservation.status === 'pending' || selectedReservation.status === 'urgent') ? (
                            <div className="p-6 border-t flex gap-3">
                                <button
                                    onClick={() => selectedReservation.id && handleReject(selectedReservation.id)}
                                    className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                                >
                                    거절하기
                                </button>
                                <button
                                    onClick={() => selectedReservation.id && handleApprove(selectedReservation.id)}
                                    className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                                >
                                    승인하기
                                </button>
                            </div>
                        ) : undefined
                    }
                />
            )}

            {/* Facility Edit Modal */}
            {editingFacility && (
                <FacilityEditModal
                    facility={editingFacility}
                    onClose={() => setEditingFacility(null)}
                    onSave={() => {
                        loadData();
                        toast.success('시설 정보가 업데이트되었습니다.');
                    }}
                />
            )}
        </div>
    );
};
