import React, { useEffect, useState } from 'react';
import { Reservation, ViewState, Facility } from '../types';
import { getFacilityReservations, approveReservation, rejectReservation, getUserFacility, getFacilitySubscription, getFacilityConsultations, answerConsultation, Consultation, markConsultationAsRead, supabase } from '../lib/queries';
import { ReservationList } from './ReservationList';
import { ConsultationList } from './ConsultationList';
import { ReservationDetailModal } from './ReservationDetailModal';
import { FacilityEditModal } from './FacilityEditModal';
import { FacilityFAQManager } from './FacilityFAQManager';
import { ConfirmModal } from '../src/components/common/ConfirmModal';
import { Loader2, CheckCircle, XCircle, Clock, ArrowLeft, Home, Edit, Building2, MapPin, Phone, ArrowRight, Siren, HelpCircle, MessageSquare } from 'lucide-react';

interface Props {
    user: any;
    facilities: any[];
    onNavigate: (view: any, context?: { facilityId?: string }) => void;
}

export const FacilityAdminView: React.FC<Props> = ({ user, facilities, onNavigate }) => {
    const [myFacilityId, setMyFacilityId] = useState<string | null>(null);
    const [fetchedFacility, setFetchedFacility] = useState<Facility | null>(null);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'cancelled' | 'faq' | 'consultations'>('pending');
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
    const [subscription, setSubscription] = useState<any>(null);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Get the single facility owned by this user
            const { getUserFacility, getFacility } = await import('../lib/queries');
            const facilityId = await getUserFacility(user.id);
            setMyFacilityId(facilityId);

            if (facilityId) {
                // [Fix] If facility is not in props, fetch it directly
                const foundInProps = facilities.find(f => f.id === facilityId);
                if (foundInProps) {
                    setFetchedFacility(foundInProps);
                } else {
                    const data = await getFacility(facilityId);
                    setFetchedFacility(data);
                }

                // Get reservations for this specific facility
                const res = await getFacilityReservations(facilityId);
                // Sort by date
                res.sort((a, b) => b.date.getTime() - a.date.getTime());
                setReservations(res);

                // Get subscription info
                const sub = await getFacilitySubscription(facilityId);
                setSubscription(sub);

                // Get consultations
                const cons = await getFacilityConsultations(facilityId);
                setConsultations(cons);
            }
        } catch (err) {
            console.error('Error loading facility data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Realtime Subscription
    useEffect(() => {
        if (!myFacilityId) return;

        console.log('Setting up Realtime subscription for facility:', myFacilityId);

        // 1. Consultations Subscription
        const consultationChannel = supabase
            .channel('facility-consultations')
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
        const reservationChannel = supabase
            .channel('facility-reservations')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reservations',
                    filter: `facility_id=eq.${myFacilityId}`
                },
                (payload) => {
                    console.log('Realtime Reservation Update:', payload);
                    if (payload.eventType === 'INSERT') {
                        // Map database row to UI Reservation type if needed
                        const newRes = {
                            ...payload.new,
                            facilityId: payload.new.facility_id,
                            facilityName: payload.new.facility_name,
                            date: new Date(payload.new.visit_date),
                            timeSlot: payload.new.time_slot,
                            visitorName: payload.new.user_name || payload.new.visitor_name,
                            visitorCount: payload.new.visitor_count || 1,
                            userPhone: payload.new.user_phone,
                            status: payload.new.status as any
                        } as Reservation;

                        setReservations(prev => [newRes, ...prev]);

                        // Notify user about new booking
                        if (newRes.status === 'urgent') {
                            alert('🚨 신규 긴급 예약이 접수되었습니다!');
                        } else {
                            // Non-blocking notification or toast would be better, but alert is clear.
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        setReservations(prev => prev.map(r =>
                            r.id === payload.new.id ? {
                                ...r,
                                ...payload.new,
                                facilityId: payload.new.facility_id,
                                facilityName: payload.new.facility_name,
                                date: new Date(payload.new.visit_date),
                                timeSlot: payload.new.time_slot,
                                visitorName: payload.new.user_name || payload.new.visitor_name,
                                visitorCount: payload.new.visitor_count || 1,
                                userPhone: payload.new.user_phone,
                                status: payload.new.status as any
                            } : r
                        ));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(consultationChannel);
            supabase.removeChannel(reservationChannel);
        };
    }, [myFacilityId]);

    const handleApprove = async (reservationId: string) => {
        if (!confirm('이 예약을 승인하시겠습니까?')) return;

        try {
            await approveReservation(reservationId);
            setReservations(prev => prev.map(r =>
                r.id === reservationId ? { ...r, status: 'confirmed' as const } : r
            ));
            setSelectedReservation(null);
            alert('예약이 승인되었습니다.');
        } catch (err) {
            alert('예약 승인 중 오류가 발생했습니다.');
        }
    };

    const handleReject = async (reservationId: string) => {
        const reason = prompt('거절 사유를 입력해주세요 (선택):');

        try {
            await rejectReservation(reservationId, reason || undefined);
            setReservations(prev => prev.map(r =>
                r.id === reservationId ? { ...r, status: 'cancelled' as const } : r
            ));
            setSelectedReservation(null);
            alert('예약이 거절되었습니다.');
        } catch (err) {
            alert('예약 거절 중 오류가 발생했습니다.');
        }
    };

    // [Fix] Use fetchedFacility as fallback if not in prop array
    const myFacility = facilities.find(f => f.id === myFacilityId) || fetchedFacility;
    const pendingCount = reservations.filter(r => r.status === 'pending' || r.status === 'urgent').length;
    const urgentCount = reservations.filter(r => r.status === 'urgent').length;
    // Unread count based on is_read flag (fallback to waiting if is_read undefined for legacy)
    const consultationCount = consultations.filter(c => !c.is_read).length;

    return (
        <div className="h-full overflow-y-auto pt-24 pb-20 px-4 bg-gray-50">
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
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-md text-sm"
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

            {(!subscription || !subscription.plan_id) && myFacility && (
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
                                    {subscription?.plan_id === 'premium' && (
                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold border border-purple-200">
                                            PREMIUM
                                        </span>
                                    )}
                                    {subscription?.plan_id === 'enterprise' && (
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

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-xl p-4 border">
                    <div className="flex items-center gap-2 text-yellow-600 mb-1">
                        <Clock size={20} />
                        <span className="text-xs font-medium">대기중</span>
                    </div>
                    <p className="text-2xl font-bold">
                        {reservations.filter(r => r.status === 'pending' || r.status === 'urgent').length}
                    </p>
                    {reservations.filter(r => r.status === 'urgent').length > 0 && (
                        <p className="text-xs text-red-500 font-bold mt-1">
                            🚨 긴급 {reservations.filter(r => r.status === 'urgent').length}건
                        </p>
                    )}
                </div>
                <div className="bg-white rounded-xl p-4 border">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                        <CheckCircle size={20} />
                        <span className="text-xs font-medium">확정</span>
                    </div>
                    <p className="text-2xl font-bold">{reservations.filter(r => r.status === 'confirmed').length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <XCircle size={20} />
                        <span className="text-xs font-medium">취소</span>
                    </div>
                    <p className="text-2xl font-bold">{reservations.filter(r => r.status === 'cancelled').length}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex-1 min-w-[100px] py-2 px-4 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'pending'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    예약 대기 ({reservations.filter(r => r.status === 'pending' || r.status === 'urgent').length})
                </button>
                <button
                    onClick={() => setActiveTab('consultations')}
                    className={`flex-1 min-w-[100px] py-2 px-4 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1 ${activeTab === 'consultations'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <MessageSquare size={16} />
                    상담 문의
                    {consultationCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold">
                            {consultationCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('confirmed')}
                    className={`flex-1 min-w-[80px] py-2 px-4 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'confirmed'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    확정 ({reservations.filter(r => r.status === 'confirmed').length})
                </button>
                <button
                    onClick={() => setActiveTab('cancelled')}
                    className={`flex-1 min-w-[80px] py-2 px-4 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'cancelled'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    취소 ({reservations.filter(r => r.status === 'cancelled').length})
                </button>
                <button
                    onClick={() => setActiveTab('faq')}
                    className={`flex-1 min-w-[80px] py-2 px-4 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'faq'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    data-testid="faq-tab"
                >
                    <div className="flex items-center justify-center gap-1">
                        <HelpCircle size={16} /> FAQ
                    </div>
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'consultations' ? (
                <ConsultationList
                    consultations={consultations}
                    onAnswer={async (id, text) => {
                        const success = await answerConsultation(id, text);
                        if (success) {
                            setConsultations(prev => prev.map(c =>
                                c.id === id ? { ...c, answer: text, answered_at: new Date().toISOString(), status: 'accepted', is_read: true } : c
                            ));
                            loadData(); // Reload for freshness
                        }
                    }}
                    onRead={async (id) => {
                        const success = await markConsultationAsRead(id);
                        if (success) {
                            setConsultations(prev => prev.map(c =>
                                c.id === id ? { ...c, is_read: true } : c
                            ));
                        }
                    }}
                />
            ) : activeTab === 'faq' ? (
                <FacilityFAQManager />
            ) : isLoading ? (
                <div className="text-center py-10">
                    <Loader2 size={32} className="animate-spin text-primary mx-auto" />
                </div>
            ) : myFacilityId ? (
                <ReservationList
                    reservations={reservations.filter(r => activeTab === 'pending' ? (r.status === 'pending' || r.status === 'urgent') : r.status === activeTab)}
                    onViewDetails={setSelectedReservation}
                    emptyMessage={
                        activeTab === 'pending' ? '대기중인 예약이 없습니다.' :
                            activeTab === 'confirmed' ? '확정된 예약이 없습니다.' :
                                '취소된 예약이 없습니다.'
                    }
                />
            ) : null}

            <ConfirmModal />

            {/* Reservation Detail Modal with Admin Actions */}
            {selectedReservation && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                        <ReservationDetailModal
                            reservation={selectedReservation}
                            facility={facilities.find(f => f.id === selectedReservation.facilityId)}
                            onClose={() => setSelectedReservation(null)}
                            onCancel={undefined}
                        />

                        {/* Admin Action Buttons */}
                        {(selectedReservation.status === 'pending' || selectedReservation.status === 'urgent') && (
                            <div className="p-6 border-t flex gap-3">
                                <button
                                    onClick={() => handleReject(selectedReservation.id)}
                                    className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                                >
                                    거절하기
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedReservation.id)}
                                    className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                                >
                                    승인하기
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Facility Edit Modal */}
            {editingFacility && (
                <FacilityEditModal
                    facility={editingFacility}
                    onClose={() => setEditingFacility(null)}
                    onSave={() => {
                        loadData();
                        window.location.reload(); // 시설 정보 새로고침
                    }}
                />
            )}
        </div>
    );
};
