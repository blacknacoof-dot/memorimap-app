import { useState, useCallback } from 'react';
import { getAuthClient } from '../lib/supabaseClient';
import { useSession } from '../lib/auth';
import { Facility, Reservation, ViewState } from '../types';

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
 */
export const useReservations = (
  isSignedIn: boolean,
  user: { id: string } | null,
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void,
  setShowLoginModal: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedFacility: (facility: Facility | null) => void,
  setViewState: (state: ViewState) => void
): UseReservationsReturn => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const { session } = useSession();

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

    if (!user?.id) {
      showToast("사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", 'error');
      return;
    }

    try {
      const client = await getAuthClient(session, { strict: true });
      const { data, error } = await client
        .from('reservations')
        .insert({
          user_id: user.id,
          facility_id: reservation.facility_id,
          facility_name: reservation.facility_name,
          visit_date: reservation.visit_date,
          time_slot: reservation.time_slot,
          visitor_name: reservation.visitor_name,
          visitor_count: reservation.visitor_count,
          contact_number: reservation.contact_number || null,
          purpose: reservation.purpose,
          special_requests: reservation.special_requests,
          status: reservation.status,
          payment_amount: reservation.payment_amount,
          payment_id: reservation.payment_id || null
        })
        .select()
        .single();

      if (error) throw error;

      // DB에서 반환된 실제 데이터 사용 (가짜 ID 방지)
      const savedReservation: Reservation = {
        ...reservation,
        id: data.id,
        created_at: data.created_at,
      };
      setReservations(prev => [...prev, savedReservation]);
      setIsBooking(false);
      setSelectedFacility(null);
      setViewState(ViewState.MY_PAGE);
      showToast("예약이 확정되었습니다!");
    } catch (err) {
      console.error('Reservation error:', err);
      showToast("예약 중 오류가 발생했습니다.", 'error');
    }
  }, [isSignedIn, user?.id, showToast, setShowLoginModal, setSelectedFacility, setViewState, session]);

  /**
   * 예약 상태 업데이트
   */
  const handleUpdateReservation = useCallback(async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const client = await getAuthClient(session, { strict: true });
      const { error } = await client
        .from('reservations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) {
      console.error('Reservation update error:', err);
      showToast('예약 상태 업데이트 중 오류가 발생했습니다.', 'error');
    }
  }, [showToast, session]);

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
