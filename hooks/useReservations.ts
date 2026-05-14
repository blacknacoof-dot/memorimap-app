import { useState, useCallback } from 'react';
import { getAuthClient } from '../lib/supabaseClient';
import { useSession } from '../lib/auth';
import { Facility, Reservation, ViewState } from '../types';

interface UseReservationsReturn {
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  handleBookingConfirm: (reservation: Reservation) => Promise<Reservation | null>;
  handleCreatePendingReservation: (reservation: Reservation) => Promise<Reservation | null>;
  handleFinalizePendingReservation: (reservationId: string) => Promise<void>;
  handleCleanupPendingReservation: (reservationId: string) => Promise<void>;
  handleUpdateReservation: (id: string, status: 'confirmed' | 'cancelled') => void;
  isBooking: boolean;
  setIsBooking: React.Dispatch<React.SetStateAction<boolean>>;
}

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

  const ensureCanBook = useCallback(() => {
    if (!isSignedIn) {
      showToast('예약을 위해 로그인이 필요합니다.', 'error');
      setShowLoginModal(true);
      setIsBooking(false);
      return false;
    }

    if (!user?.id) {
      showToast('사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.', 'error');
      return false;
    }

    return true;
  }, [isSignedIn, showToast, setShowLoginModal, user?.id]);

  const insertReservation = useCallback(async (reservation: Reservation) => {
    if (!user?.id) {
      throw new Error('Missing user id');
    }

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
        payment_id: reservation.payment_id || null,
        payment_verified: reservation.payment_verified ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...reservation,
      id: data.id,
      created_at: data.created_at,
      payment_verified: data.payment_verified,
    } as Reservation;
  }, [session, user?.id]);

  const handleCreatePendingReservation = useCallback(async (reservation: Reservation) => {
    if (!ensureCanBook()) return null;

    const savedReservation = await insertReservation({
      ...reservation,
      status: 'pending',
      payment_verified: false,
    });
    setReservations(prev => [...prev, savedReservation]);
    return savedReservation;
  }, [ensureCanBook, insertReservation]);

  const handleCleanupPendingReservation = useCallback(async (reservationId: string) => {
    try {
      const client = await getAuthClient(session, { strict: true });
      const { error } = await client
        .from('reservations')
        .delete()
        .eq('id', reservationId)
        .eq('status', 'pending')
        .eq('payment_verified', false);

      if (error) throw error;
      setReservations(prev => prev.filter(r => r.id !== reservationId));
    } catch (_err) {
      // Payment errors are already shown to the user; cleanup failure is non-blocking.
    }
  }, [session]);

  const handleFinalizePendingReservation = useCallback(async (reservationId: string) => {
    setReservations(prev => prev.map(r => (
      r.id === reservationId ? { ...r, payment_verified: true, paid_at: new Date().toISOString() } : r
    )));
    setIsBooking(false);
    setSelectedFacility(null);
    setViewState(ViewState.MY_PAGE);
    showToast('예약이 확정되었습니다.');
  }, [setSelectedFacility, setViewState, showToast]);

  const handleBookingConfirm = useCallback(async (reservation: Reservation): Promise<Reservation | null> => {
    if (!ensureCanBook()) return null;

    try {
      const savedReservation = await insertReservation(reservation);
      setReservations(prev => [...prev, savedReservation]);
      setIsBooking(false);
      setSelectedFacility(null);
      setViewState(ViewState.MY_PAGE);
      showToast('예약이 확정되었습니다.');
      return savedReservation;
    } catch (_err) {
      showToast('예약 중 오류가 발생했습니다.', 'error');
      return null;
    }
  }, [ensureCanBook, insertReservation, setSelectedFacility, setViewState, showToast]);

  const handleUpdateReservation = useCallback(async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const client = await getAuthClient(session, { strict: true });
      const { error } = await client
        .from('reservations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (_err) {
      showToast('예약 상태 업데이트 중 오류가 발생했습니다.', 'error');
    }
  }, [showToast, session]);

  return {
    reservations,
    setReservations,
    handleBookingConfirm,
    handleCreatePendingReservation,
    handleFinalizePendingReservation,
    handleCleanupPendingReservation,
    handleUpdateReservation,
    isBooking,
    setIsBooking,
  };
};

export default useReservations;
