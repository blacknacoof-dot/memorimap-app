import React, { useState, useEffect } from 'react';
import { User, Settings2, Heart, Calendar, Star, Info, Edit, MoreHorizontal, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'; // [Phase 2] Error Handler
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { useMyFavorites, useToggleFavorite, useRemoveFavorite, useMyEndingNote, useUpsertEndingNote, useFavoriteAnalysis } from '@/hooks/useFavorites';
import { useMyJourney } from '@/hooks/useMyJourney';
import { generateRuleBasedInsight } from '@/lib/generateJourneyInsight';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
// Fixed: Removed missing import and standardized Types
import { EditProfileModal } from './EditProfileModal';
import { ReservationList } from './ReservationList';
import { LegalModal } from './LegalModal';
import { ReservationDetailModal } from './ReservationDetailModal';

// Types
import { Reservation, Facility, ViewState } from '../types';
import { getUserPhoneNumber, getMyReservations, cancelReservation } from '../lib/queries';

interface Props {
    isLoggedIn: boolean;
    user: any;
    userRole?: string;
    // Legacy props compat (optional if we fetch internally)
    reservations?: Reservation[];
    facilities?: Facility[];
    onLoginClick: () => void;
    onNavigate?: (view: any) => void;
    onSelectFacility?: (facility: Facility) => void;
}

export const MyPageV2: React.FC<Props> = ({
    isLoggedIn,
    user,
    userRole,
    reservations: propReservations,
    facilities = [],
    onLoginClick,
    onNavigate,
    onSelectFacility,
}) => {
    const navigate = useNavigate();

    // Data Hooks
    const { data: favorites, isLoading: isFavoritesLoading } = useMyFavorites();
    const { data: journey, isLoading: isJourneyLoading } = useMyJourney();
    const { data: endingNote, isLoading: isEndingNoteLoading } = useMyEndingNote();
    const { data: analysis } = useFavoriteAnalysis();
    const removeFavorite = useRemoveFavorite();
    const upsertEndingNote = useUpsertEndingNote();

    // Local State
    const [activeTab, setActiveTab] = useState<'kisuengbo' | 'favorites' | 'reservations'>('kisuengbo'); // kisuengbo = 기승앤보 (Journey)
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showLegalModal, setShowLegalModal] = useState(false);
    const [userPhone, setUserPhone] = useState<string>('');

    // Reservations State (Legacy logic)
    const [myReservations, setMyReservations] = useState<Reservation[]>(propReservations || []);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [isLoadingReservations, setIsLoadingReservations] = useState(false);

    // Profile Phone Fetch
    useEffect(() => {
        if (isLoggedIn && user) {
            getUserPhoneNumber(user.id).then(phone => setUserPhone(phone || ''));
            if (!propReservations) fetchMyReservations();
        }
    }, [isLoggedIn, user, propReservations]);

    const fetchMyReservations = async () => {
        if (!user) return;
        setIsLoadingReservations(true);
        try {
            const data = await getMyReservations(user.id);
            // Fix: Map raw data to satisfy Reservation interface
            const safeReservations: Reservation[] = (data as any[]).map(r => ({
                id: r.id,
                facility_id: r.facility_id || r.facilityId, // Handle both for safety
                facility_name: r.facility_name || r.facilityName,
                visit_date: r.visit_date || r.date,
                time_slot: r.time_slot || r.timeSlot,
                status: r.status,
                visitor_count: r.visitor_count || r.visitorCount,
                // message: r.message, // removed as it is not in Reservation type
                created_at: r.created_at || r.createdAt,
                user_id: r.user_id || user.id, // Ensure user_id is present
                visitor_name: r.visitor_name || r.visitorName || user.name,
                contact_number: r.contact_number || r.userPhone || '',
                purpose: r.purpose || '일반 방문',
                payment_amount: r.payment_amount || r.paymentAmount || 0,
                paid_at: r.paid_at || r.paidAt || undefined
            }));
            setMyReservations(safeReservations);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingReservations(false);
        }
    };

    const handleCancelReservation = async (reservationId: string) => {
        if (!confirm('정말로 예약을 취소하시겠습니까?')) return;
        try {
            await cancelReservation(reservationId);
            setMyReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status: 'cancelled' as const } : r));
            setSelectedReservation(null);
            toast.success('예약이 취소되었습니다.');
        } catch (err) {
            toast.error('예약 취소 중 오류가 발생했습니다.');
        }
    };

    // Login Check
    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-20">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                    <User size={40} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">로그인이 필요합니다</h2>
                <p className="text-gray-500 text-sm max-w-xs">
                    나만의 추모 여정을 기록하고 맞춤형 서비스를 이용하시려면 로그인해주세요.
                </p>
                <button
                    onClick={onLoginClick}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold mt-4 shadow-lg"
                >
                    로그인 / 회원가입
                </button>
            </div>
        );
    }

    const progress = journey?.progress;
    const events = journey?.events || [];
    const pendingReservationsCount = myReservations.filter(r => r.status === 'pending' || r.status === 'urgent').length;

    return (
        <div className="h-full overflow-y-auto bg-gray-50 pb-24">
            {/* Header / Profile */}
            <div className="bg-white p-6 pt-24 pb-6 rounded-b-3xl shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-100">
                            {user?.imageUrl ? (
                                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={30} className="text-gray-400" />
                            )}
                        </div>
                        {userRole === 'facility_admin' && (
                            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold border-2 border-white">
                                업체
                            </span>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">{user.name}님</h2>
                            <button onClick={() => setShowEditProfile(true)} className="p-2 text-gray-400 hover:text-gray-600">
                                <Settings2 size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {userPhone && <p className="text-sm text-gray-400 mt-0.5">{userPhone}</p>}
                    </div>
                </div>

                {/* Insight Card */}
                {activeTab === 'kisuengbo' && (
                    <div className="mt-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-5 border border-pink-100/50 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-gray-800 leading-relaxed">
                                "{generateRuleBasedInsight(analysis || null)}"
                            </p>
                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse"></span>
                                <span>AI 메모리맵 컨시어지 분석</span>
                            </div>
                        </div>
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex px-4 mt-6 gap-2 sticky top-[72px] z-20">
                <button
                    onClick={() => setActiveTab('kisuengbo')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${activeTab === 'kisuengbo' ? 'bg-gray-900 text-white shadow-md scale-[1.02]' : 'bg-white text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    기승앤보
                </button>
                <button
                    onClick={() => setActiveTab('favorites')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${activeTab === 'favorites' ? 'bg-pink-500 text-white shadow-md scale-[1.02]' : 'bg-white text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    찜 목록
                </button>
                <button
                    onClick={() => setActiveTab('reservations')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${activeTab === 'reservations' ? 'bg-primary text-white shadow-md scale-[1.02]' : 'bg-white text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    예약 {pendingReservationsCount > 0 && <span className="ml-1 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{pendingReservationsCount}</span>}
                </button>
            </div>

            <div className="p-4 space-y-6">
                {/* TAB: 기승앤보 (Journey) */}
                {activeTab === 'kisuengbo' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">

                        {/* 1. Progress Section */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">나의 추모 여정</h3>
                                    <p className="text-xs text-gray-500 mt-1">준비된 마무리는 남은 가족에게 가장 큰 선물입니다.</p>
                                </div>
                                <span className="text-2xl font-black text-pink-500">{progress?.progress_percentage || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progress?.progress_percentage || 0}%` }}
                                ></div>
                            </div>
                        </section>

                        {/* 2. Timeline Section */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gray-900"></span>
                                여정 기록
                            </h3>

                            {events.length > 0 ? (
                                <div className="relative pl-4 border-l-2 border-gray-100 space-y-8 my-2">
                                    {events.map((event) => (
                                        <div key={event.id} className="relative">
                                            <span className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-white border-[3px] border-pink-400"></span>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-pink-500 font-bold mb-0.5">
                                                    {format(new Date(event.event_date), 'yyyy.MM.dd')}
                                                </span>
                                                <span className="text-gray-800 font-medium text-sm">{event.event_title}</span>
                                                {event.event_description && (
                                                    <div className="mt-2 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 leading-relaxed">
                                                        {event.event_description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    아직 기록된 여정이 없습니다.<br />
                                    시설을 찜하거나 상담을 시작해보세요.
                                </div>
                            )}
                        </section>

                        {/* 3. Ending Note Summary */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900">나의 엔딩 노트</h3>
                                <button className="text-xs font-bold text-gray-400 hover:text-gray-900 flex items-center gap-1">
                                    전체 보기 <ChevronRight size={14} />
                                </button>
                            </div>

                            {endingNote ? (
                                <div className="space-y-4">
                                    {endingNote.preferred_method && (
                                        <div className="flex flex-wrap gap-2">
                                            {endingNote.preferred_method.map((m, i) => (
                                                <span key={i} className="px-3 py-1 bg-pink-50 text-pink-600 text-xs font-bold rounded-lg border border-pink-100">
                                                    #{m}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {endingNote.final_message && (
                                        <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 italic border border-gray-100">
                                            "{endingNote.final_message}"
                                        </div>
                                    )}
                                    {!endingNote.preferred_method && !endingNote.final_message && (
                                        <div onClick={() => toast.info('준비 중인 기능입니다 (편집)')} className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center cursor-pointer hover:border-pink-300 hover:bg-pink-50 transition-colors">
                                            <p className="text-sm text-gray-400 font-medium">+ 엔딩 노트 내용 추가하기</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div onClick={() => toast.info('준비 중인 기능입니다 (편집)')} className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center cursor-pointer hover:border-pink-300 hover:bg-pink-50 transition-colors">
                                    <p className="text-sm font-bold text-gray-500">작성된 엔딩 노트가 없습니다</p>
                                    <p className="text-xs text-gray-400 mt-1">미리 남기는 기록은 소중한 자산이 됩니다.</p>
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* TAB: 찜 목록 (Favorites) */}
                {activeTab === 'favorites' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                        {isFavoritesLoading ? (
                            <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div></div>
                        ) : favorites && favorites.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {favorites.map((fav) => (
                                    <div
                                        key={fav.id}
                                        onClick={() => {
                                            // Construct Facility object for navigation
                                            if (onSelectFacility) {
                                                // Try to find full object in props, else construct basic one
                                                const fullFacility = facilities.find(f => f.id === fav.facility_id);
                                                if (fullFacility) {
                                                    onSelectFacility(fullFacility);
                                                } else {
                                                    toast.error("시설 상세 정보를 불러올 수 없습니다.");
                                                }
                                            }
                                        }}
                                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                                    >
                                        <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                                            <OptimizedImage
                                                src={fav.facility_image_url}
                                                alt={fav.facility_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-900 truncate pr-2">{fav.facility_name}</h4>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeFavorite.mutate(fav.facility_id); }}
                                                        className="text-pink-500 hover:bg-pink-50 p-1.5 rounded-full -mt-2 -mr-2"
                                                    >
                                                        <Heart size={18} fill="currentColor" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate mt-1">{fav.facility_category}</p>
                                                {fav.private_memo && (
                                                    <div className="mt-2 text-xs bg-yellow-50 text-yellow-800 px-2 py-1 rounded inline-block max-w-full truncate">
                                                        📝 {fav.private_memo}
                                                    </div>
                                                )}
                                            </div>
                                            {fav.private_rating && (
                                                <div className="flex items-center text-xs font-bold text-yellow-500">
                                                    <Star size={12} fill="currentColor" className="mr-1" />
                                                    {fav.private_rating}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                <Heart size={40} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-500 font-medium">아직 찜한 시설이 없습니다.</p>
                                <p className="text-xs text-gray-400 mt-1">마음에 드는 장소를 찾아보세요.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: 예약 (Reservations) - Legacy Integration */}
                {activeTab === 'reservations' && (
                    <div className="animate-in slide-in-from-bottom-2 duration-300">
                        <ReservationList
                            reservations={myReservations}
                            onViewDetails={setSelectedReservation}
                            onCancel={handleCancelReservation}
                            emptyMessage="예약 내역이 없습니다."
                        />
                    </div>
                )}

            </div>

            {/* Modals */}
            {showEditProfile && (
                <EditProfileModal
                    user={user}
                    onClose={() => setShowEditProfile(false)}
                    onUpdate={() => window.location.reload()}
                />
            )}
            {selectedReservation && (
                <ReservationDetailModal
                    reservation={selectedReservation}
                    facility={facilities.find(f => f.id === selectedReservation.facility_id)}
                    onClose={() => setSelectedReservation(null)}
                    onCancel={(selectedReservation.status === 'pending' || selectedReservation.status === 'urgent') ? () => selectedReservation.id && handleCancelReservation(selectedReservation.id) : undefined}
                />
            )}
        </div>
    );
};
