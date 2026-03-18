import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ReservationFormValues } from '../../lib/schemas';

const PURPOSES = ['?꾩옣 ?듭궗', '?λ? ?곷떞', '?쒖꽕 寃ы븰', '湲고?'];
const PURPOSES_MEMORIAL = ['?꾩옣 ?듭궗', '遊됱븞 ?곷떞', '?먯뿰???곷떞', '湲곗씪 異붾え'];
const PURPOSES_PET = ['湲곕낯 ?λ?', '?붿옣 吏꾪뻾', '遊됱븞/?ㅽ넠 ?곷떞', '湲고? 臾몄쓽'];

interface Props {
  register: UseFormRegister<ReservationFormValues>;
  errors: FieldErrors<ReservationFormValues>;
  formValues: ReservationFormValues;
  onCountChange: (count: number) => void;
  onPurposeChange: (purpose: string) => void;
  isPetFacility: boolean;
  isMemorialFacility?: boolean;
}

export const StepInfo: React.FC<Props> = ({
  register, errors, formValues, onCountChange, onPurposeChange, isPetFacility, isMemorialFacility,
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        ?좎껌???깊븿 <span className="text-red-500">*</span>
      </label>
      <input {...register('visitor_name')} data-testid='reservation-visitor-name' className="w-full p-3 border rounded-lg focus:ring-2 outline-none" placeholder="?깊븿" />
      {errors.visitor_name && <p className="text-red-500 text-xs">{errors.visitor_name.message}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        ?곕씫泥?<span className="text-red-500">*</span>
      </label>
      <input {...register('contact_number')} data-testid='reservation-contact-number' className="w-full p-3 border rounded-lg focus:ring-2 outline-none" placeholder="010-XXXX-XXXX" />
      {errors.contact_number && <p className="text-red-500 text-xs">{errors.contact_number.message}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">諛⑸Ц ?몄썝</label>
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
      <label className="block text-sm font-medium text-gray-700 mb-1">諛⑸Ц 紐⑹쟻</label>
      <div className="flex flex-wrap gap-2">
        {(isPetFacility ? PURPOSES_PET : isMemorialFacility ? PURPOSES_MEMORIAL : PURPOSES).map(p => (
          <button
            key={p}
            onClick={() => onPurposeChange(p)}
            data-testid={`reservation-purpose-${p}`}
            className={`px-3 py-1.5 text-sm rounded-full border ${formValues.purpose === p ? 'bg-primary text-white' : 'bg-white'}`}
          >
            {p}
          </button>
        ))}
      </div>
      {errors.purpose && <p className="text-red-500 text-xs">{errors.purpose.message}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">?붿껌 ?ы빆</label>
      <textarea {...register('request_note')} className="w-full p-3 border rounded-lg h-20 resize-none outline-none" placeholder="?붿껌?ы빆" />
    </div>
  </div>
);

