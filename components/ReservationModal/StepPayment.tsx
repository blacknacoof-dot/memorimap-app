import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Facility } from '../../types';
import { ReservationFormValues } from '../../lib/schemas';

interface Props {
  facility: Facility;
  formValues: ReservationFormValues;
  depositAmount: number;
  reservationType: 'BASIC' | 'VIP' | 'CONSULTATION';
  setReservationType: (t: 'BASIC' | 'VIP' | 'CONSULTATION') => void;
  hasPaymentFailed: boolean;
  isProcessingPayment: boolean;
  handlePaymentProcess: () => void;
}

export const StepPayment: React.FC<Props> = ({
  facility, formValues, depositAmount,
  reservationType, setReservationType,
  hasPaymentFailed, isProcessingPayment, handlePaymentProcess,
}) => (
  <div className="space-y-6">
    <div className="bg-gray-50 p-4 rounded-xl border">
      <p className="font-bold">{facility.name}</p>
      <p>{formValues.visit_date} {formValues.visit_time}</p>
      <p>결제금액: {depositAmount.toLocaleString()}원</p>
    </div>
    <div className="space-y-3">
      <p className="font-medium">상품 선택</p>
      <button
        onClick={() => setReservationType('BASIC')}
        data-testid="reservation-type-basic"
        className={`w-full p-3 border rounded-xl text-left ${reservationType === 'BASIC' ? 'border-primary bg-blue-50' : ''}`}
      >
        실속형 (1만원)
      </button>
      <button
        onClick={() => setReservationType('VIP')}
        data-testid="reservation-type-vip"
        className={`w-full p-3 border rounded-xl text-left ${reservationType === 'VIP' ? 'border-primary bg-blue-50' : ''}`}
      >
        VIP (10만원)
      </button>
    </div>
    {hasPaymentFailed && (
      <button
        onClick={handlePaymentProcess}
        disabled={isProcessingPayment}
        className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        <AlertCircle size={16} />
        다시 결제하기
      </button>
    )}
  </div>
);
