import React, { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { analytics } from '../../lib/analytics';
import { Facility, Reservation as LegacyReservation } from '../../types';
import { useReservation } from './useReservation';
import { UrgentForm } from './UrgentForm';
import { StepDate } from './StepDate';
import { StepTime } from './StepTime';
import { StepInfo } from './StepInfo';
import { StepPayment } from './StepPayment';
import { StepComplete } from './StepComplete';

const STEPS_STANDARD = ['날짜', '시간', '정보', '결제', '완료'];
const STEPS_URGENT = ['긴급 접수', '정보 확인', '접수 완료'];

interface Props {
  facility: Facility;
  onClose: () => void;
  onConfirm: (reservation: LegacyReservation) => Promise<LegacyReservation | null | void> | LegacyReservation | null | void;
  onCreatePendingReservation?: (reservation: LegacyReservation) => Promise<LegacyReservation | null>;
  onFinalizePendingReservation?: (reservationId: string) => Promise<void>;
  onCleanupPendingReservation?: (reservationId: string) => Promise<void>;
  reservationMode?: 'STANDARD' | 'URGENT';
}

export const ReservationModal: React.FC<Props> = ({
  facility, onClose, onConfirm, onCreatePendingReservation, onFinalizePendingReservation, onCleanupPendingReservation, reservationMode = 'STANDARD',
}) => {
  const isPetFacility = facility.type === 'pet' || facility.type === 'pet_funeral';
  const isMemorialFacility = ['cemetery', 'columbarium', 'natural_burial', 'sea_burial'].includes(facility.type || '');
  const steps = reservationMode === 'URGENT' ? STEPS_URGENT : STEPS_STANDARD;

  const {
    step, setStep,
    isProcessingPayment, isPaymentOpen, hasPaymentFailed,
    reservationType, setReservationType,
    formValues, register, errors, setValue,
    cancelPayment, handleDateSelect, handleNext, handlePaymentProcess, handleCompleteConfirm,
    availableDates, depositAmount,
  } = useReservation({
    facility,
    onClose,
    onConfirm,
    onCreatePendingReservation,
    onFinalizePendingReservation,
    onCleanupPendingReservation,
    reservationMode,
  });

  useEffect(() => {
    if (step > 0 && step < 4) analytics.reservationStep(step, facility.id);
    if (step === 4) analytics.reservationComplete(facility.id, facility.name, depositAmount || 0);
  }, [step, facility.id, facility.name, depositAmount]);

  const renderContent = () => {
    if (reservationMode === 'URGENT') {
      if (step === 0) return <UrgentForm register={register} errors={errors} isPetFacility={isPetFacility} />;
      if (step === 1) return <div><p>정보 확인</p></div>;
      if (step === 2) return <StepComplete onClose={onClose} isUrgent />;
    }
    switch (step) {
      case 0: return (
        <StepDate
          availableDates={availableDates}
          selectedDate={formValues.visit_date}
          onSelect={handleDateSelect}
          error={errors.visit_date}
          isPetFacility={isPetFacility}
        />
      );
      case 1: return (
        <StepTime
          selectedTime={formValues.visit_time}
          onSelect={(t) => setValue('visit_time', t)}
          error={errors.visit_time}
          isPetFacility={isPetFacility}
        />
      );
      case 2: return (
        <StepInfo
          register={register}
          errors={errors}
          formValues={formValues}
          onCountChange={(n) => setValue('visitor_count', n)}
          onPurposeChange={(p) => setValue('purpose', p)}
          isPetFacility={isPetFacility}
          isMemorialFacility={isMemorialFacility}
        />
      );
      case 3: return (
        <StepPayment
          facility={facility}
          formValues={formValues}
          depositAmount={depositAmount}
          reservationType={reservationType}
          setReservationType={setReservationType}
          hasPaymentFailed={hasPaymentFailed}
          isProcessingPayment={isProcessingPayment}
          handlePaymentProcess={handlePaymentProcess}
        />
      );
      case 4: return <StepComplete onClose={handleCompleteConfirm} />;
      default: return null;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-between mb-6 px-2 pt-2">
      {steps.map((s, i) => (
        <div key={i} className={`flex flex-col items-center ${i <= step ? (isPetFacility ? 'text-purple-600' : 'text-primary') : 'text-gray-300'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border transition-colors ${i <= step ? (isPetFacility ? 'bg-purple-600 text-white border-purple-600' : 'bg-primary text-white border-primary') : 'bg-white border-gray-300'}`}>
            {i + 1}
          </div>
          <span className="text-[10px] mt-1 font-medium">{s}</span>
        </div>
      ))}
    </div>
  );

  const getTitle = () => {
    if (reservationMode === 'URGENT') return '🚨 긴급 장례 접수';
    if (isPetFacility) return '🐾 반려동물 장례 예약';
    if (isMemorialFacility) return '🏛️ 추모시설 방문 예약';
    return '📅 장례식장 방문 예약';
  };

  // 긴급 접수 완료 — 풀스크린 단순 완료 모달
  if (step === 2 && reservationMode === 'URGENT') {
    return (
      <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
          {renderContent()}
        </div>
      </div>
    );
  }

  // 표준 예약 완료 — 풀스크린 단순 완료 모달
  if (step === 4) {
    return (
      <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="reservation-modal">
      {isPaymentOpen && (
        <button
          onClick={cancelPayment}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2147483646] bg-white text-slate-700 px-6 py-3.5 rounded-full shadow-2xl border border-slate-200 font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} />
          결제 취소하고 돌아가기
        </button>
      )}
      <div className="bg-white w-full max-w-lg md:rounded-2xl rounded-t-3xl max-h-[90dvh] h-auto flex flex-col shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">{getTitle()}</h2>
          <button onClick={onClose} data-testid="reservation-close-button" className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-full">
            <X className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {renderStepIndicator()}
          {renderContent()}
        </div>
        <div className="p-4 border-t bg-white z-50 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="px-6 py-3.5 border rounded-xl text-sm font-bold text-gray-600">
              이전
            </button>
          )}
          <button
            onClick={step === 3 ? handlePaymentProcess : handleNext}
            data-testid="reservation-next-button"
            className={`flex-1 text-white py-3.5 rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${
              reservationMode === 'URGENT' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {reservationMode === 'URGENT'
              ? (step === 0 ? '긴급 접수 제출' : '확인')
              : (step === 3 ? '결제하기' : '다음 단계')
            }
          </button>
        </div>
      </div>
    </div>
  );
};
