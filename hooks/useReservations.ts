import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Reservation, ViewState } from '../types';

interface UseReservationsReturn {
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  handleBookingConfirm: (reservation: Reservation) => Promise<void>;
  handleUpdateReservation: (id: string, status: 'confirmed' | 'cancelled') => void;
  isBooking: boolean;
  setIsBooking: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * 예약 관리 Hook
 * @param isSignedIn 로그인 여부
 * @param user 현재 사용자
 * @param showToast 토스트 표시 함수
 * @param setShowLoginModal 로그인 모달 표시 함수
 * @param setSelectedFacility 선택된 시설 설정 함수
 * @param setViewState 뷰 상태 설정 함수
 * @returns 예약 상태 및 제어 함수
 */
export const useReservations = (
  isSignedIn: boolean,
  user: any,
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void,
  setShowLoginModal: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedFacility: React.Dispatch<React.SetStateAction<any>>,
  setViewState: (state: ViewState) => void
): UseReservationsReturn => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  /**
   * 예약 확정 처리
   */
  const handleBookingConfirm = useCallback(async (reservation: Reservation) => {
    if (!isSignedIn) {
      showToast("예약을 위해 로그인이 필요합니다.", 'error');
      setShowLoginModal(true);
      setIsBooking(false);
      return;
    }

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          user_id: user?.id,
          facility_id: reservation.facility_id,
          facility_name: reservation.facility_name,
          visit_date: reservation.visit_date,
          time_slot: reservation.time_slot,
          visitor_name: reservation.visitor_name,
          visitor_count: reservation.visitor_count,
          purpose: reservation.purpose,
          special_requests: reservation.special_requests,
          status: reservation.status,
          payment_amount: reservation.payment_amount
        })
        .select()
        .single();

      if (error) throw error;

      setReservations(prev => [...prev, reservation]);
      setIsBooking(false);
      setSelectedFacility(null);
      setViewState(ViewState.MY_PAGE);
      showToast("예약이 확정되었습니다!");
    } catch (err) {
      console.error('Reservation error:', err);
      showToast("예약 중 오류가 발생했습니다.", 'error');
    }
  }, [isSignedIn, user?.id, showToast, setShowLoginModal, setSelectedFacility, setViewState]);

  /**
   * 예약 상태 업데이트
   */
  const handleUpdateReservation = useCallback((id: string, status: 'confirmed' | 'cancelled') => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }, []);

  return {
    reservations,
    setReservations,
    handleBookingConfirm,
    handleUpdateReservation,
    isBooking,
    setIsBooking
  };
};

export default useReservations;
