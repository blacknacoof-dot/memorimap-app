import React from 'react';
import { AlertCircle, Phone } from 'lucide-react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ReservationFormValues } from '../../lib/schemas';

interface Props {
  register: UseFormRegister<ReservationFormValues>;
  errors: FieldErrors<ReservationFormValues>;
  isPetFacility: boolean;
}

export const UrgentForm: React.FC<Props> = ({ register, errors, isPetFacility }) => (
  <div className="space-y-6">
    <div className={`border p-4 rounded-xl flex items-start gap-3 ${isPetFacility ? 'bg-purple-50 border-purple-100' : 'bg-red-50 border-red-100'}`}>
      <AlertCircle className={`${isPetFacility ? 'text-purple-600' : 'text-red-600'} shrink-0 mt-0.5`} />
      <div className={`text-sm ${isPetFacility ? 'text-purple-800' : 'text-red-800'}`}>
        <p className="font-bold mb-1">긴급 장례 접수</p>
        <p>24시간 즉시 운구 및 빈소 준비를 도와드립니다.</p>
      </div>
    </div>

    {/* 1. 고인 정보 */}
    <section className="space-y-3">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-slate-100 text-xs flex items-center justify-center text-slate-600">1</span>
        고인 정보
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">성함</label>
          <input {...register('deceased_name')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="고인 성함" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">성별</label>
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <input type="radio" {...register('deceased_gender')} value="male" className="hidden peer" />
              <div className="w-full p-2.5 text-center text-sm border rounded-lg peer-checked:bg-slate-800 peer-checked:text-white peer-checked:border-slate-800 transition-colors">남성</div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input type="radio" {...register('deceased_gender')} value="female" className="hidden peer" />
              <div className="w-full p-2.5 text-center text-sm border rounded-lg peer-checked:bg-slate-800 peer-checked:text-white peer-checked:border-slate-800 transition-colors">여성</div>
            </label>
          </div>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">현재 계신 곳 (출발지)</label>
          <input {...register('departure_location')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="예: 서울대병원 요양병원 301호" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">사망 원인 (선택)</label>
          <input {...register('cause_of_death')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="예: 숙환, 병사, 사고 등" />
        </div>
      </div>
    </section>

    <hr className="border-slate-100" />

    {/* 2. 신청자 정보 */}
    <section className="space-y-3">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-slate-100 text-xs flex items-center justify-center text-slate-600">2</span>
        신청자(상주) 정보
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">신청자 성함 <span className="text-red-500">*</span></label>
          <input {...register('visitor_name')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="홍길동" />
          {errors.visitor_name && <p className="text-red-500 text-[10px] mt-1">{errors.visitor_name.message}</p>}
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">고인과의 관계</label>
          <select {...register('relation')} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none">
            <option value="">선택</option>
            <option value="자녀">자녀</option>
            <option value="배우자">배우자</option>
            <option value="형제/자매">형제/자매</option>
            <option value="손자/손녀">손자/손녀</option>
            <option value="친척">친척</option>
            <option value="지인">지인</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">연락처 <span className="text-red-500">*</span></label>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-3 text-gray-400" />
            <input {...register('contact_number')} className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="010-0000-0000" />
          </div>
          {errors.contact_number && <p className="text-red-500 text-[10px] mt-1">{errors.contact_number.message}</p>}
        </div>
      </div>
    </section>

    <hr className="border-slate-100" />

    {/* 3. 운구 차량 */}
    <section className="space-y-3">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-slate-100 text-xs flex items-center justify-center text-slate-600">3</span>
        운구 차량
      </h3>
      <div className="flex gap-3">
        <label className="flex-1 cursor-pointer group">
          <input type="radio" {...register('transport_needs')} value="yes" className="hidden peer" defaultChecked />
          <div className="p-3 border rounded-xl peer-checked:bg-red-50 peer-checked:border-red-200 peer-checked:text-red-700 transition-all h-full">
            <div className="font-bold text-sm mb-0.5">운구차 필요</div>
            <div className="text-[10px] text-gray-500">현재 계신 곳으로 앰뷸런스를 보내드립니다.</div>
          </div>
        </label>
        <label className="flex-1 cursor-pointer group">
          <input type="radio" {...register('transport_needs')} value="no" className="hidden peer" />
          <div className="p-3 border rounded-xl peer-checked:bg-slate-100 peer-checked:border-slate-300 transition-all h-full">
            <div className="font-bold text-sm mb-0.5">직접 이동</div>
            <div className="text-[10px] text-gray-500">자차 또는 사설 구급차로 이동합니다.</div>
          </div>
        </label>
      </div>
    </section>

    <hr className="border-slate-100" />

    {/* 4. 희망 사항 */}
    <section className="space-y-3">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-slate-100 text-xs flex items-center justify-center text-slate-600">4</span>
        희망 사항
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">종교</label>
          <select {...register('religion')} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none">
            <option value="">무교/선택 안 함</option>
            <option value="기독교">기독교</option>
            <option value="불교">불교</option>
            <option value="천주교">천주교</option>
            <option value="기타">기타</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">장례 방법</label>
          <select {...register('burial_method')} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none">
            <option value="cremation">화장 (납골/수목장)</option>
            <option value="burial">매장</option>
          </select>
        </div>
      </div>
    </section>

    <hr className="border-slate-100" />

    {/* 5. 비상 연락망 */}
    <section className="space-y-3">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-slate-100 text-xs flex items-center justify-center text-slate-600">5</span>
        비상 연락망 <span className="text-gray-400 font-normal text-xs ml-1">(선택)</span>
      </h3>
      <input {...register('emergency_contact')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="가족/친지 연락처 (010-0000-0000)" />
    </section>
  </div>
);
