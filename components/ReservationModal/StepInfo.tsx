import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ReservationFormValues } from '../../lib/schemas';

const PURPOSES = ['현장 답사', '기일 추모', '분양 상담', '기타'];
const PURPOSES_PET = ['기본 장례', '화장 진행', '봉안/스톤 상담', '기타 문의'];

interface Props {
  register: UseFormRegister<ReservationFormValues>;
  errors: FieldErrors<ReservationFormValues>;
  formValues: ReservationFormValues;
  onCountChange: (count: number) => void;
  onPurposeChange: (purpose: string) => void;
  isPetFacility: boolean;
}

export const StepInfo: React.FC<Props> = ({
  register, errors, formValues, onCountChange, onPurposeChange, isPetFacility,
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        신청자 성함 <span className="text-red-500">*</span>
      </label>
      <input {...register('visitor_name')} className="w-full p-3 border rounded-lg focus:ring-2 outline-none" placeholder="성함" />
      {errors.visitor_name && <p className="text-red-500 text-xs">{errors.visitor_name.message}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        연락처 <span className="text-red-500">*</span>
      </label>
      <input {...register('contact_number')} className="w-full p-3 border rounded-lg focus:ring-2 outline-none" placeholder="010-XXXX-XXXX" />
      {errors.contact_number && <p className="text-red-500 text-xs">{errors.contact_number.message}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">방문 인원</label>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onCountChange(Math.max(1, (formValues.visitor_count || 1) - 1))}
          className="w-10 h-10 bg-gray-100 rounded-full"
        >-</button>
        <span className="font-bold">{formValues.visitor_count || 1}명</span>
        <button
          onClick={() => onCountChange((formValues.visitor_count || 1) + 1)}
          className="w-10 h-10 bg-gray-100 rounded-full"
        >+</button>
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">방문 목적</label>
      <div className="flex flex-wrap gap-2">
        {(isPetFacility ? PURPOSES_PET : PURPOSES).map(p => (
          <button
            key={p}
            onClick={() => onPurposeChange(p)}
            className={`px-3 py-1.5 text-sm rounded-full border ${formValues.purpose === p ? 'bg-primary text-white' : 'bg-white'}`}
          >
            {p}
          </button>
        ))}
      </div>
      {errors.purpose && <p className="text-red-500 text-xs">{errors.purpose.message}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">요청 사항</label>
      <textarea {...register('request_note')} className="w-full p-3 border rounded-lg h-20 resize-none outline-none" placeholder="요청사항" />
    </div>
  </div>
);
