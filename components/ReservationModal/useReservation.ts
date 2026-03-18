import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Facility, Reservation as LegacyReservation } from '../../types';
import { ReservationSchema, ReservationFormValues } from '../../lib/schemas';
import { format, addDays, startOfToday } from 'date-fns';
import { toast } from 'sonner';
import { requestPayment, verifyPayment, PORTONE_CONFIG } from '../../lib/portone';

interface UseReservationProps {
  facility: Facility;
  onClose: () => void;
  onConfirm: (reservation: LegacyReservation) => void;
  reservationMode: 'STANDARD' | 'URGENT';
}

export function useReservation({ facility, onClose: _onClose, onConfirm, reservationMode }: UseReservationProps) {
  const [step, setStep] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [hasPaymentFailed, setHasPaymentFailed] = useState(false);
  const [reservationType, setReservationType] = useState<'BASIC' | 'VIP' | 'CONSULTATION'>('VIP');
  const [paymentMethod] = useState<'CARD' | 'TRANSFER'>('CARD');

  const form = useForm<ReservationFormValues>({
    // @ts-expect-error zodResolver generic type mismatch with useForm
    resolver: zodResolver(ReservationSchema),
    mode: 'onChange',
    defaultValues: {
      status: reservationMode === 'URGENT' ? 'urgent' : 'pending',
      facility_id: facility.id,
      payment_amount: 0,
      visit_date: reservationMode === 'URGENT' ? format(new Date(), 'yyyy-MM-dd') : '',
      visit_time: reservationMode === 'URGENT' ? '긴급(즉시)' : '',
      purpose: reservationMode === 'URGENT' ? '긴급 장례 접수' : '',
      visitor_name: '',
      contact_number: '',
      visitor_count: 1,
      request_note: '',
    },
  });

  const { register, watch, setValue, trigger, handleSubmit, formState: { errors } } = form;
  const formValues = watch();

  const depositAmount = reservationType === 'CONSULTATION' ? 0 : (reservationType === 'BASIC' ? 10000 : 100000);
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i + 1));

  useEffect(() => {
    setValue('payment_amount', depositAmount);
  }, [depositAmount, setValue]);

  const cancelPayment = useCallback(() => {
    const bodyChildren = document.body.children;
    const appRoot = document.getElementById('root');
    const toRemove: Element[] = [];
    for (let i = 0; i < bodyChildren.length; i++) {
      const el = bodyChildren[i];
      if (el === appRoot || ['SCRIPT', 'LINK', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
      if (el.tagName === 'IFRAME' || (el.tagName === 'DIV' && el !== appRoot)) {
        toRemove.push(el);
      }
    }
    toRemove.forEach(el => el.remove());
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    setIsPaymentOpen(false);
    setIsProcessingPayment(false);
  }, []);

  const handleCompleteConfirm = useCallback(() => {
    _onClose();
  }, [_onClose]);

  const handleDateSelect = (date: Date) => {
    setValue('visit_date', format(date, 'yyyy-MM-dd'));
  };

  const mapToLegacy = (
    data: ReservationFormValues,
    status: LegacyReservation['status'],
    paidAmount: number,
    paymentId: string,
  ): LegacyReservation => ({
    id: `RES-${Date.now()}`,
    facility_id: facility.id,
    facility_name: facility.name,
    user_id: '',
    visit_date: data.visit_date,
    time_slot: data.visit_time,
    visitor_name: data.visitor_name,
    visitor_count: data.visitor_count,
    contact_number: data.contact_number,
    purpose: data.purpose,
    special_requests: data.request_note || '',
    status,
    payment_amount: paidAmount,
    paid_at: new Date().toISOString(),
    payment_id: paymentId,
    created_at: new Date().toISOString(),
  });

  const onUrgentSubmit = (data: ReservationFormValues) => {
    setIsProcessingPayment(true);
    const fullRequest = [
      '[긴급장례접수]',
      `고인: ${data.deceased_name || '-'} (${data.deceased_gender === 'male' ? '남' : '여'} / ${data.deceased_age || '-'}세)`,
      `사망원인: ${data.cause_of_death || '-'}`,
      `고인위치: ${data.departure_location || '-'}`,
      '----------------',
      `신청자: ${data.visitor_name} (관계: ${data.relation || '-'})`,
      `연락처: ${data.contact_number}`,
      `비상연락: ${data.emergency_contact || '없음'}`,
      '----------------',
      `운구: ${data.transport_needs === 'yes' ? '필요 (즉시 출동)' : '직접 이동'}`,
      `종교: ${data.religion || '-'}`,
      `장례방법: ${data.burial_method === 'cremation' ? '화장' : (data.burial_method === 'burial' ? '매장' : '-')}`,
    ].join('\n');

    setTimeout(() => {
      const legacyReservation: LegacyReservation = {
        id: `RES-${Date.now()}`,
        facility_id: facility.id,
        facility_name: facility.name,
        user_id: '',
        visit_date: format(new Date(), 'yyyy-MM-dd'),
        time_slot: '긴급(즉시)',
        visitor_name: data.visitor_name,
        visitor_count: 1,
        contact_number: data.contact_number,
        purpose: '긴급 장례 접수',
        special_requests: fullRequest,
        status: 'urgent',
        payment_amount: 0,
        paid_at: new Date().toISOString(),
        payment_id: `URGENT-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setStep(2);
      onConfirm(legacyReservation);
      setIsProcessingPayment(false);
    }, 1000);
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof ReservationFormValues)[] = [];
    if (reservationMode === 'URGENT') {
      if (step === 0) fieldsToValidate = ['visitor_name', 'contact_number', 'purpose'];
    } else {
      if (step === 0) fieldsToValidate = ['visit_date'];
      if (step === 1) fieldsToValidate = ['visit_time'];
      if (step === 2) fieldsToValidate = ['visitor_name', 'contact_number', 'visitor_count', 'purpose'];
    }
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      if (reservationMode === 'URGENT' && step === 0) {
        // @ts-expect-error handleSubmit generic type mismatch
        handleSubmit(onUrgentSubmit)();
      } else {
        setStep(prev => prev + 1);
      }
    }
  };

  const handlePaymentProcess = async () => {
    setIsProcessingPayment(true);
    setHasPaymentFailed(false);
    const data = formValues;

    if (paymentMethod === 'TRANSFER' || reservationType === 'CONSULTATION') {
      setTimeout(() => {
        const status = reservationType === 'CONSULTATION' ? 'confirmed' : 'pending';
        const payId = reservationType === 'CONSULTATION' ? `FREE-${Date.now()}` : `TRANSFER-${Date.now()}`;
        const legacy = mapToLegacy(data, status, depositAmount, payId);
        legacy.special_requests = `[연락처: ${data.contact_number}] ${legacy.special_requests}`;
        onConfirm(legacy);
        setStep(4);
        setIsProcessingPayment(false);
      }, 1000);
      return;
    }

    try {
      setIsPaymentOpen(true);
      const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const response = await requestPayment({
        storeId: PORTONE_CONFIG.STORE_ID,
        channelKey: PORTONE_CONFIG.CHANNEL_KEY,
        paymentId,
        orderName: `${facility.name} 방문 예약금`,
        totalAmount: depositAmount,
        currency: 'CURRENCY_KRW',
        payMethod: paymentMethod,
        customer: { fullName: data.visitor_name, phoneNumber: data.contact_number },
      });

      if (response.code != null) throw new Error(response.message || 'Payment failed');

      const verification = await verifyPayment({
        paymentId: response.paymentId || paymentId,
        expectedAmount: depositAmount,
      });
      if (!verification.verified) {
        throw new Error(verification.error || '결제 검증에 실패했습니다. 고객센터에 문의해주세요.');
      }

      const legacy = mapToLegacy(data, 'pending', depositAmount, response.paymentId || paymentId);
      legacy.special_requests = `[연락처: ${data.contact_number}] ${legacy.special_requests}`;
      onConfirm(legacy);
      setStep(4);
    } catch (error: unknown) {
      // Payment error handled by toast below
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('취소')) {
        toast('결제가 취소되었습니다.');
      } else {
        toast.error(msg || '결제 진행 중 오류가 발생했습니다.');
        setHasPaymentFailed(true);
      }
    } finally {
      setIsProcessingPayment(false);
      setIsPaymentOpen(false);
    }
  };

  return {
    step, setStep,
    isProcessingPayment,
    isPaymentOpen,
    hasPaymentFailed,
    reservationType, setReservationType,
    formValues,
    register, errors,
    setValue,
    cancelPayment,
    handleDateSelect,
    handleNext,
    handlePaymentProcess,
    handleCompleteConfirm,
    availableDates,
    depositAmount,
  };
}
