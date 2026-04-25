import React from 'react';
import { User, Info } from 'lucide-react';
import { Reservation, Facility, ViewState, FuneralCompany } from '../../types';
import { ReservationDetailModal } from '../ReservationDetailModal';
import { EditProfileModal } from '../EditProfileModal';
import { LegalModal } from '../LegalModal';
import IntegratedJourneyView from '../IntegratedJourneyView';

import { toast } from 'sonner';
import { useMyPage } from './useMyPage';
import { ProfileSection } from './ProfileSection';
import { SubscriptionCard, PendingAdminNotice } from './SubscriptionCard';
import { ReservationTabs } from './ReservationTabs';
import { FavoriteTabs } from './FavoriteTabs';
import { MyReviews } from './MyReviews';

interface Props {
  isLoggedIn: boolean;
  user: { id: string; name: string; email: string; imageUrl?: string } | null;
  userRole?: string;
  reservations?: Reservation[];
  facilities: Facility[];
  onLoginClick: () => void;
  onNavigate?: (view: ViewState) => void;
  onReviewDeleted?: (facilityId: string, reviewId: string, rating: number) => void;
  onSelectFacility?: (facility: Facility) => void;
  onSelectCompany?: (company: FuneralCompany) => void;
}

export const MyPageView: React.FC<Props> = ({
  isLoggedIn, user, userRole, facilities, onLoginClick, onNavigate,
  onSelectFacility, onSelectCompany,
}) => {
  const {
    myReservations, isLoadingReservations,
    selectedReservation, setSelectedReservation,
    showEditProfile, setShowEditProfile,
    showLegalModal, setShowLegalModal,
    reservationTab, setReservationTab,
    favoriteTab, setFavoriteTab,
    userPhone,
    myFavorites, isLoadingFavorites, extraFacilities,
    sangjoFavorites, isLoadingSangjoFavorites,
    consultationCount, journeyRefreshKey, setJourneyRefreshKey,
    pendingCount, filteredReservations,
    handleRemoveFavorite, handleRemoveSangjoFavorite, handleCancelReservation,
    fetchUserPhone,
  } = useMyPage({ isLoggedIn, user, facilities });

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-20">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-2">
          <User size={40} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">내 정보</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          로그인하면 맞춤 추천과 예약 내역을 확인할 수 있어요
        </p>
        <button onClick={onLoginClick} className="bg-primary text-white px-8 py-3 rounded-xl font-bold mt-4 shadow-lg">
          로그인 / 회원가입
        </button>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-full overflow-y-auto pt-16 pb-20 px-4 bg-gray-50">
      <ProfileSection
        user={user}
        userRole={userRole}
        userPhone={userPhone}
        pendingCount={pendingCount}
        onEditProfile={() => setShowEditProfile(true)}
        onNavigate={onNavigate}
      />

      {onNavigate && <SubscriptionCard userRole={userRole} onNavigate={onNavigate} />}
      {userRole === 'pending_facility_admin' && <PendingAdminNotice />}

      <ReservationTabs
        activeTab={reservationTab}
        setActiveTab={setReservationTab}
        myReservations={myReservations}
        filteredReservations={filteredReservations}
        isLoadingReservations={isLoadingReservations}
        userId={user.id}
        facilities={facilities}
        onSelectFacility={onSelectFacility}
        onViewDetails={setSelectedReservation}
        onCancel={handleCancelReservation}
        onWriteReview={(facilityId) => {
          const facility = facilities.find(f => String(f.id) === String(facilityId));
          if (facility) onSelectFacility?.(facility);
        }}
      />

      <FavoriteTabs
        activeTab={favoriteTab}
        setActiveTab={setFavoriteTab}
        myFavorites={myFavorites}
        isLoadingFavorites={isLoadingFavorites}
        extraFacilities={extraFacilities}
        facilities={facilities}
        sangjoFavorites={sangjoFavorites}
        isLoadingSangjoFavorites={isLoadingSangjoFavorites}
        onSelectFacility={onSelectFacility}
        onSelectCompany={onSelectCompany}
        onRemoveFavorite={handleRemoveFavorite}
        onRemoveSangjoFavorite={handleRemoveSangjoFavorite}
      />

      <div className="mb-4">
        <IntegratedJourneyView
          facilityFavoriteCount={myFavorites.length}
          sangjoFavoriteCount={sangjoFavorites.length}
          consultationCount={consultationCount}
          refreshTrigger={journeyRefreshKey}
          onLoginClick={onLoginClick}
          onUpgrade={onNavigate ? () => onNavigate(ViewState.PERSONAL_SUBSCRIPTION) : undefined}
        />
      </div>

      {/* 서비스 정보 */}
      <MyReviews userId={user.id} facilities={facilities} />

      <div className="mt-2 border-t pt-2 relative z-10 bg-gray-50">
        <button
          onClick={(e) => { e.stopPropagation(); setShowLegalModal(true); }}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors text-[11px] w-full py-1.5 px-1 rounded active:bg-gray-100"
        >
          <Info size={13} />
          <span>개인정보 처리방침 및 오픈소스 라이선스</span>
        </button>
        <p className="text-[10px] text-gray-300 px-1 mt-1">© {new Date().getFullYear()} (주)아톰케어 · v1.0.0</p>
      </div>

      {/* 모달 */}
      {selectedReservation && (
        <ReservationDetailModal
          reservation={selectedReservation}
          facility={facilities.find(f => f.id === selectedReservation.facility_id) || {
            id: selectedReservation.facility_id,
            name: selectedReservation.facility_name || '시설 정보 없음',
            address: '',
          } as Facility}
          onClose={() => setSelectedReservation(null)}
          onCancel={
            (selectedReservation.status === 'pending' || selectedReservation.status === 'urgent')
              ? () => selectedReservation.id && handleCancelReservation(selectedReservation.id)
              : undefined
          }
        />
      )}
      {showEditProfile && (
        <EditProfileModal
          user={{ id: user.id, name: user.name, email: user.email, imageUrl: user.imageUrl, phone: userPhone }}
          onClose={() => setShowEditProfile(false)}
          onUpdate={() => {
            fetchUserPhone();
            setJourneyRefreshKey(k => k + 1);
            toast.success('프로필이 업데이트되었습니다.');
          }}
        />
      )}
      {showLegalModal && <LegalModal onClose={() => setShowLegalModal(false)} />}
    </div>
  );
};
