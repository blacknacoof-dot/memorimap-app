import React, { useEffect, useState } from 'react';
import { User, MessageSquare, Loader2, Settings2, Calendar } from 'lucide-react';
import { Reservation, Facility, Review, ViewState } from '../types';
import { getUserReviews, deleteReview, getMyReservations, cancelReservation, getUserPhoneNumber } from '../lib/queries';
import { ReviewCard } from './ReviewCard';
import { ReservationList } from './ReservationList';
import { ReservationDetailModal } from './ReservationDetailModal';
import { EditProfileModal } from './EditProfileModal';
import { LegalModal } from './LegalModal';
import { Info, Heart, Star } from 'lucide-react';
import { favoriteService, Favorite } from '../services/favoriteService';
import { sangjoFavoriteService, SangjoFavorite } from '../services/sangjoFavoriteService';
import { FUNERAL_COMPANIES } from '../constants';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MyConsultations } from './dashboard/MyConsultations';

interface Props {
    isLoggedIn: boolean;
    user: any;
    userRole?: string;
    reservations: Reservation[];
    facilities: Facility[];
    onLoginClick: () => void;
    onNavigate?: (view: any) => void;
    onReviewDeleted?: (facilityId: string, reviewId: string, rating: number) => void;
}

export const MyPageView: React.FC<Props> = ({
    isLoggedIn,
    user,
    userRole,
    reservations: propReservations,
    facilities,
    onLoginClick,
    onNavigate,
    onReviewDeleted
}) => {
    const [myReviews, setMyReviews] = useState<Review[]>([]);
    const [myReservations, setMyReservations] = useState<Reservation[]>(propReservations);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [isLoadingReservations, setIsLoadingReservations] = useState(false);
    const [activeTab, setActiveTab] = useState<'consultations' | 'pending' | 'confirmed' | 'cancelled' | 'favorites' | 'sangjo_favorites'>('consultations');
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showLegalModal, setShowLegalModal] = useState(false);
    const [userPhone, setUserPhone] = useState<string>('');
    const [myFavorites, setMyFavorites] = useState<Favorite[]>([]);
    const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
    const [sangjoFavorites, setSangjoFavorites] = useState<SangjoFavorite[]>([]);
    const [isLoadingSangjoFavorites, setIsLoadingSangjoFavorites] = useState(false);

    useEffect(() => {
        if (isLoggedIn && user) {
            fetchMyReviews();
            fetchMyReservations();
            fetchUserPhone();
            fetchMyFavorites();
            fetchSangjoFavorites();
        }
    }, [isLoggedIn, user]);

    const fetchUserPhone = async () => {
        if (!user) return;
        const phone = await getUserPhoneNumber(user.id);
        setUserPhone(phone || '');
    };

    const fetchMyReviews = async () => {
        if (!user) return;
        setIsLoadingReviews(true);
        try {
            const data = await getUserReviews(user.id);
            setMyReviews(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingReviews(false);
        }
    };

    const fetchMyReservations = async () => {
        if (!user) return;
        setIsLoadingReservations(true);
        try {
            const data = await getMyReservations(user.id);
            setMyReservations(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingReservations(false);
        }
    };

    const fetchMyFavorites = async () => {
        if (!user) return;
        setIsLoadingFavorites(true);
        try {
            const data = await favoriteService.getFavorites(user.id);
            setMyFavorites(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingFavorites(false);
        }
    };

    const handleRemoveFavorite = async (facilityId: string) => {
        if (!user) return;
        if (!confirm('즐겨찾기를 해제하시겠습니까?')) return;
        try {
            await favoriteService.toggleFavorite(user.id, facilityId);
            setMyFavorites(prev => prev.filter(f => f.facility_id !== facilityId));
            toast.success('즐겨찾기가 해제되었습니다.');
        } catch (err) {
            toast.error('오류가 발생했습니다.');
        }
    };

    const fetchSangjoFavorites = async () => {
        if (!user) return;
        setIsLoadingSangjoFavorites(true);
        try {
            const data = await sangjoFavoriteService.getFavorites(user.id);
            setSangjoFavorites(data || []);
        } catch (err) {
            console.error('Failed to fetch sangjo favorites:', err);
        } finally {
            setIsLoadingSangjoFavorites(false);
        }
    };

    const handleRemoveSangjoFavorite = async (companyId: string) => {
        if (!user) return;
        if (!confirm('즐겨찾기를 해제하시겠습니까?')) return;
        try {
            const company = FUNERAL_COMPANIES.find(c => c.id === companyId);
            if (!company) return;

            await sangjoFavoriteService.toggleFavorite(user.id, company);
            setSangjoFavorites(prev => prev.filter(f => f.company_id !== companyId));
            toast.success('즐겨찾기가 해제되었습니다.');
        } catch (err) {
            toast.error('오류가 발생했습니다.');
        }
    };

    const handleDeleteReview = async (id: string) => {
        try {
            const reviewToDelete = myReviews.find(r => r.id === id);
            if (!reviewToDelete) return;

            await deleteReview(id);
            setMyReviews(prev => prev.filter(r => r.id !== id));

            if (onReviewDeleted) {
                onReviewDeleted(reviewToDelete.facility_id, id, reviewToDelete.rating);
            }
        } catch (err) {
            alert('리뷰 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleCancelReservation = async (reservationId: string) => {
        if (!confirm('정말로 예약을 취소하시겠습니까?')) return;

        try {
            await cancelReservation(reservationId);
            setMyReservations(prev => prev.map(r =>
                r.id === reservationId ? { ...r, status: 'cancelled' as const } : r
            ));
            setSelectedReservation(null);
            alert('예약이 취소되었습니다.');
        } catch (err) {
            alert('예약 취소 중 오류가 발생했습니다.');
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-20">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                    <User size={40} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">로그인이 필요합니다</h2>
                <p className="text-gray-500 text-sm max-w-xs">
                    예약 내역을 확인하고 맞춤형 서비스를 이용하시려면 로그인해주세요.
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

    const filteredReservations = myReservations.filter(r => activeTab === 'pending' ? (r.status === 'pending' || r.status === 'urgent') : r.status === activeTab);
    const pendingCount = myReservations.filter(r => r.status === 'pending' || r.status === 'urgent').length;

    return (
        <div className="h-full overflow-y-auto pt-24 pb-36 px-4 bg-gray-50">
            {/* Profile Section */}
            <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center relative">
                    {user?.imageUrl ? (
                        <img src={user.imageUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
                            <User size={32} className="text-gray-500" />
                        </div>
                    )}
                    {userRole === 'facility_admin' && (
                        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold border-2 border-white">
                            업체
                        </div>
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="font-bold text-xl">{user.name || '이름 없음'}님</h2>
                        <button
                            onClick={() => setShowEditProfile(true)}
                            className="text-gray-400 hover:text-primary transition-colors"
                            title="프로필 수정"
                        >
                            <Settings2 size={16} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {userPhone ? (
                        <p className="text-sm text-gray-500">{userPhone}</p>
                    ) : (
                        <p className="text-xs text-gray-400 mt-1">등록된 전화번호가 없습니다</p>
                    )}
                    {pendingCount > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                            예정된 예약 {pendingCount}건
                        </span>
                    )}
                </div>
                {userRole === 'facility_admin' && onNavigate && (
                    <button
                        onClick={() => onNavigate(ViewState.FACILITY_ADMIN)}
                        className="ml-auto bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-amber-600 transition-colors whitespace-nowrap"
                    >
                        업체 관리 홈
                    </button>
                )}
            </div>

            {/* Pending Admin Notice Card */}
            {userRole === 'pending_facility_admin' && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 animate-in slide-in-from-top-2">
                    <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                        <span className="bg-amber-100 p-1 rounded">📢</span> 업체 계정 전환 안내
                    </h3>
                    <p className="text-sm text-amber-900 leading-relaxed">
                        관리자 승인을 위해 <b>사업자 등록증</b>을 아래 메일로 보내주세요.<br />
                        <span className="font-mono bg-amber-100 px-1 rounded">blacknacoof@gmail.com</span>
                    </p>
                    <p className="text-xs text-amber-700 mt-2">
                        * 서류 검토 후 24시간 이내에 업체 관리자(Facility Admin) 권한이 부여됩니다.
                    </p>
                </div>
            )}

            {/* Reservations Section */}
            <h3 className="font-bold mb-4 border-l-4 border-primary pl-3">나의 예약 내역</h3>

            <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('consultations')}
                    className={`min-w-0 py-2 px-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm ${activeTab === 'consultations'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    title="상담"
                >
                    <Calendar size={14} className="shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">상담</span>
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`min-w-0 py-2 px-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm ${activeTab === 'pending'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    title="대기중"
                >
                    <span className="whitespace-nowrap">대기 {myReservations.filter(r => r.status === 'pending' || r.status === 'urgent').length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('confirmed')}
                    className={`min-w-0 py-2 px-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm ${activeTab === 'confirmed'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    title="확정됨"
                >
                    <span className="whitespace-nowrap">확정 {myReservations.filter(r => r.status === 'confirmed').length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('cancelled')}
                    className={`min-w-0 py-2 px-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm ${activeTab === 'cancelled'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    title="취소됨"
                >
                    <span className="whitespace-nowrap">취소 {myReservations.filter(r => r.status === 'cancelled').length}</span>
                </button>
            </div>

            <div className="mb-8">
                {activeTab === 'consultations' ? (
                    <MyConsultations userId={user.id} />
                ) : isLoadingReservations ? (
                    <div className="text-center py-10">
                        <Loader2 size={32} className="animate-spin text-primary mx-auto" />
                    </div>
                ) : (
                    <ReservationList
                        reservations={filteredReservations}
                        onViewDetails={setSelectedReservation}
                        onCancel={handleCancelReservation}
                        emptyMessage={
                            activeTab === 'pending' ? '대기중인 예약이 없습니다.' :
                                activeTab === 'confirmed' ? '확정된 예약이 없습니다.' :
                                    '취소된 예약이 없습니다.'
                        }
                    />
                )}
            </div>

            {/* Favorites Section */}
            <h3 className="font-bold mb-4 border-l-4 border-pink-500 pl-3">찜한 목록</h3>

            <div className="flex gap-1.5 mb-4">
                <button
                    onClick={() => setActiveTab('favorites')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-sm ${activeTab === 'favorites'
                        ? 'bg-pink-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-pink-50'
                        }`}
                    title="즐겨찾기 시설"
                >
                    <Heart size={14} fill={activeTab === 'favorites' ? 'currentColor' : 'none'} className="shrink-0" />
                    <span className="whitespace-nowrap">시설 {myFavorites.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('sangjo_favorites')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-sm ${activeTab === 'sangjo_favorites'
                        ? 'bg-pink-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-pink-50'
                        }`}
                    title="즐겨찾기 상조"
                >
                    <Heart size={14} fill={activeTab === 'sangjo_favorites' ? 'currentColor' : 'none'} className="shrink-0" />
                    <span className="whitespace-nowrap">상조 {sangjoFavorites.length}</span>
                </button>
            </div>

            <div className="mb-8">
                {activeTab === 'favorites' ? (
                    isLoadingFavorites ? (
                        <div className="text-center py-10">
                            <Loader2 size={32} className="animate-spin text-primary mx-auto" />
                        </div>
                    ) : myFavorites.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">
                            즐겨찾기한 시설이 없습니다.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {myFavorites.map(fav => {
                                const facility = facilities.find(f => String(f.id) === String(fav.facility_id));
                                if (!facility) return null;
                                return (
                                    <div key={fav.id} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow relative">
                                        <div className="flex gap-4">
                                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                                {facility.imageUrl ? (
                                                    <img src={facility.imageUrl} alt={facility.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-900 truncate pr-6">{facility.name}</h3>
                                                    <button
                                                        onClick={() => handleRemoveFavorite(facility.id)}
                                                        className="text-red-500 hover:bg-red-50 p-1 rounded-full absolute top-3 right-3"
                                                        title="즐겨찾기 해제"
                                                    >
                                                        <Heart size={18} fill="currentColor" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 truncate">{facility.address}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium">
                                                        {facility.type === 'charnel' ? '봉안시설' :
                                                            facility.type === 'natural' ? '자연장' :
                                                                facility.type === 'funeral' ? '장례식장' :
                                                                    facility.type === 'sea' ? '해양장' :
                                                                        facility.type === 'pet' ? '동물장' : '공원묘지'}
                                                    </span>
                                                    <div className="flex items-center text-xs text-yellow-500 font-bold">
                                                        <Star size={12} fill="currentColor" />
                                                        <span className="ml-0.5">{Math.round(facility.rating || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : activeTab === 'sangjo_favorites' ? (
                    isLoadingSangjoFavorites ? (
                        <div className="text-center py-10">
                            <Loader2 size={32} className="animate-spin text-primary mx-auto" />
                        </div>
                    ) : sangjoFavorites.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">
                            즐겨찾기한 상조 회사가 없습니다.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sangjoFavorites.map(fav => {
                                const company = FUNERAL_COMPANIES.find(c => c.id === fav.company_id);
                                if (!company) return null;
                                return (
                                    <div key={fav.id} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow relative">
                                        <div className="flex gap-4">
                                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                                <img
                                                    src={company.imageUrl}
                                                    alt={company.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-900 truncate pr-6">{company.name}</h3>
                                                    <button
                                                        onClick={() => handleRemoveSangjoFavorite(company.id)}
                                                        className="text-red-500 hover:bg-red-50 p-1 rounded-full absolute top-3 right-3"
                                                        title="즐겨찾기 해제"
                                                    >
                                                        <Heart size={18} fill="currentColor" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{company.description}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="flex items-center text-xs text-yellow-500 font-bold">
                                                        <Star size={12} fill="currentColor" />
                                                        <span className="ml-0.5">{company.rating}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(fav.created_at).toLocaleDateString()} 추가
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : null}
            </div>

            {/* My Reviews Section */}
            <h3 className="font-bold mb-4 border-l-4 border-primary pl-3 flex items-center gap-2">
                나의 작성 리뷰
                {isLoadingReviews && <Loader2 size={16} className="animate-spin text-gray-400" />}
            </h3>

            {
                myReviews.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">
                        작성한 리뷰가 없습니다.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {myReviews.map(review => {
                            const facility = facilities.find(f => f.id === review.facility_id);
                            return (
                                <div key={review.id} className="bg-white p-4 rounded-xl shadow-sm border">
                                    <ReviewCard
                                        review={review}
                                        isOwner={true}
                                        onDelete={handleDeleteReview}
                                        facilityName={facility?.name}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )
            }

            {/* Service Info Section */}
            <div className="mt-8 border-t pt-6 mb-12 relative z-10 bg-gray-50">
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent bubbling issues
                        setShowLegalModal(true);
                    }}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm w-full py-3 px-2 rounded-lg active:bg-gray-100"
                >
                    <Info size={16} />
                    <span>개인정보 처리방침 및 오픈소스 라이선스</span>
                </button>
                <div className="flex flex-col gap-1 mt-4 px-2 text-xs text-gray-400">
                    <p>© 2024 (주)아톰케어</p>
                    <p>Version 1.0.0</p>
                </div>
            </div>

            {/* Reservation Detail Modal */}
            {
                selectedReservation && (
                    <ReservationDetailModal
                        reservation={selectedReservation}
                        facility={facilities.find(f => f.id === selectedReservation.facilityId)}
                        onClose={() => setSelectedReservation(null)}
                        onCancel={(selectedReservation.status === 'pending' || selectedReservation.status === 'urgent') ? () => handleCancelReservation(selectedReservation.id) : undefined}
                    />
                )
            }
            {/* Edit Profile Modal */}
            {showEditProfile && (
                <EditProfileModal
                    user={{
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        imageUrl: user.imageUrl,
                        phone: userPhone
                    }}
                    onClose={() => setShowEditProfile(false)}
                    onUpdate={() => {
                        fetchUserPhone();
                        // Ideally trigger a full user refresh or update local state name if changed
                        // For now we rely on re-fetching phone, Name update might need context refresh or local state update
                        window.location.reload(); // Simple refresh to reflect changes in header/other components
                    }}
                />
            )}

            {showLegalModal && (
                <LegalModal onClose={() => setShowLegalModal(false)} />
            )}
        </div >
    );
};
