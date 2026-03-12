import React from 'react';
import { User, Star, ChevronDown, Info } from 'lucide-react';
import { Reservation, Facility, ViewState, FuneralCompany } from '../../types';
import { ReservationDetailModal } from '../ReservationDetailModal';
import { EditProfileModal } from '../EditProfileModal';
import { LegalModal } from '../LegalModal';
import IntegratedJourneyView from '../IntegratedJourneyView';

import { toast } from 'sonner';
import { useMyPage } from './useMyPage';
import { ProfileSection } from './ProfileSection';
import { ReservationTabs } from './ReservationTabs';
import { FavoriteTabs } from './FavoriteTabs';

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
    activeTab, setActiveTab,
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
        <h2 className="text-xl font-bold text-gray-800">로그인이 필요합니다</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          예약 내역을 확인하고 맞춤형 서비스를 이용하시려면 로그인해주세요.
        </p>
        <button onClick={onLoginClick} className="bg-primary text-white px-8 py-3 rounded-xl font-bold mt-4 shadow-lg">
          로그인 / 회원가입
        </button>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-full overflow-y-auto pt-24 pb-36 px-4 bg-gray-50">
      <ProfileSection
        user={user}
        userRole={userRole}
        userPhone={userPhone}
        pendingCount={pendingCount}
        onEditProfile={() => setShowEditProfile(true)}
        onNavigate={onNavigate}
      />

      {/* 개인 요금제 카드 */}
      {onNavigate && !['facility_admin', 'facility_manager', 'sangjo_hq_admin', 'sangjo_branch_admin'].includes(userRole || '') && (
        <button
          onClick={() => onNavigate(ViewState.PERSONAL_SUBSCRIPTION)}
          className="w-full mb-6 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white rounded-2xl p-4 flex items-center gap-4 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Star size={20} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold text-white/80">나의 요금제</p>
            <p className="text-sm font-black">무료 플랜 이용 중</p>
          </div>
          <div className="text-white/60">
            <ChevronDown size={18} className="rotate-[-90deg]" />
          </div>
        </button>
      )}

      {/* 업체 계정 전환 안내 */}
      {userRole === 'pending_facility_admin' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 animate-in slide-in-from-top-2">
          <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
            <span className="bg-amber-100 p-1 rounded">📢</span> 업체 계정 전환 안내
          </h3>
          <p className="text-sm text-amber-900 leading-relaxed">
            관리자 승인을 위해 <b>사업자 등록증</b>을 아래 메일로 보내주세요.<br />
            <span className="font-mono bg-amber-100 px-1 rounded">support@atomcare.co.kr</span>
          </p>
          <p className="text-xs text-amber-700 mt-2">
            * 서류 검토 후 24시간 이내에 업체 관리자(Facility Admin) 권한이 부여됩니다.
          </p>
        </div>
      )}

      <ReservationTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        myReservations={myReservations}
        filteredReservations={filteredReservations}
        isLoadingReservations={isLoadingReservations}
        userId={user.id}
        facilities={facilities}
        onSelectFacility={onSelectFacility}
        onViewDetails={setSelectedReservation}
        onCancel={handleCancelReservation}
      />

      <FavoriteTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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

      <div className="mb-12">
        <IntegratedJourneyView
          facilityFavoriteCount={myFavorites.length}
          sangjoFavoriteCount={sangjoFavorites.length}
          consultationCount={consultationCount}
          refreshTrigger={journeyRefreshKey}
          onLoginClick={onLoginClick}
        />
      </div>

      {/* 서비스 정보 */}
      <div className="mt-8 border-t pt-6 mb-12 relative z-10 bg-gray-50">
        <button
          onClick={(e) => { e.stopPropagation(); setShowLegalModal(true); }}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm w-full py-3 px-2 rounded-lg active:bg-gray-100"
        >
          <Info size={16} />
          <span>개인정보 처리방침 및 오픈소스 라이선스</span>
        </button>
        <div className="flex flex-col gap-1 mt-4 px-2 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} (주)아톰케어</p>
          <p>Version 1.0.0</p>
        </div>
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
