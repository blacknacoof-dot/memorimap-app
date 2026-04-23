import React from 'react';
import { Loader2, Calendar, CalendarX2 } from 'lucide-react';
import { Reservation, Facility } from '../../types';
import { ReservationList } from '../ReservationList';
import { MyConsultations } from '../dashboard/MyConsultations';
import { toast } from 'sonner';
import type { ReservationTab } from './useMyPage';

interface Props {
  activeTab: ReservationTab;
  setActiveTab: (t: ReservationTab) => void;
  myReservations: Reservation[];
  filteredReservations: Reservation[];
  isLoadingReservations: boolean;
  userId: string;
  facilities: Facility[];
  onSelectFacility?: (facility: Facility) => void;
  onViewDetails: (r: Reservation) => void;
  onCancel: (id: string) => void;
  onWriteReview?: (facilityId: string) => void;
}

export const ReservationTabs: React.FC<Props> = ({
  activeTab, setActiveTab, myReservations, filteredReservations,
  isLoadingReservations, userId, facilities, onSelectFacility,
  onViewDetails, onCancel, onWriteReview,
}) => {
  const tabClass = (tab: ReservationTab) =>
    `min-w-0 py-2.5 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm min-h-[44px] ${
      activeTab === tab ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
    }`;

  return (
    <>
      <h3 className="font-bold mb-4 border-l-4 border-primary pl-3">나의 예약 내역</h3>

      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('consultations')} className={tabClass('consultations')} title="상담">
          <Calendar size={14} className="shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">상담</span>
        </button>
        <button onClick={() => setActiveTab('pending')} className={tabClass('pending')} title="대기중">
          <span className="whitespace-nowrap">
            대기 {myReservations.filter(r => r.status === 'pending' || r.status === 'urgent').length}
          </span>
        </button>
        <button onClick={() => setActiveTab('confirmed')} className={tabClass('confirmed')} title="확정됨">
          <span className="whitespace-nowrap">
            확정 {myReservations.filter(r => r.status === 'confirmed').length}
          </span>
        </button>
        <button onClick={() => setActiveTab('cancelled')} className={tabClass('cancelled')} title="취소/거절">
          <span className="whitespace-nowrap">
            취소/거절 {myReservations.filter(r => r.status === 'cancelled' || r.status === 'rejected').length}
          </span>
        </button>
      </div>

      <div className="mb-4">
        {activeTab === 'consultations' ? (
          <MyConsultations
            userId={userId}
            onViewFacility={onSelectFacility}
            onResumeChat={(consultation) => {
              if (consultation.facility_id && onSelectFacility) {
                const facility = facilities.find(f => String(f.id) === String(consultation.facility_id));
                if (facility) { onSelectFacility(facility); return; }
              }
              toast.info('해당 시설을 찾을 수 없습니다. 지도에서 직접 검색해주세요.');
            }}
          />
        ) : isLoadingReservations ? (
          <div className="text-center py-10">
            <Loader2 size={32} className="animate-spin text-primary mx-auto" />
          </div>
        ) : (
          <ReservationList
            reservations={filteredReservations}
            onViewDetails={onViewDetails}
            onCancel={onCancel}
            onWriteReview={onWriteReview}
            emptyIcon={<CalendarX2 size={32} className="text-gray-300 mb-2" />}
            emptyMessage={
              activeTab === 'pending' ? '대기 중인 예약이 없습니다. 시설을 둘러보고 예약해보세요.' :
              activeTab === 'confirmed' ? '확정된 예약이 없습니다.' :
              '취소/거절된 예약이 없습니다.'
            }
          />
        )}
      </div>
    </>
  );
};
