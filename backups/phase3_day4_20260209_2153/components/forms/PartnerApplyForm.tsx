import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PartnerInquirySchema, PartnerInquiryFormValues } from '../../lib/schemas';

interface Props {
    onSubmit: (data: PartnerInquiryFormValues) => void;
}

export const PartnerApplyForm: React.FC<Props> = ({ onSubmit }) => {
    const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm<PartnerInquiryFormValues>({
        resolver: zodResolver(PartnerInquirySchema),
        mode: 'onChange',
        defaultValues: {
            status: 'pending',
            business_type: 'funeral_home',
            company_name: '',
            contact_person: '',
            contact_number: '',
            email: ''
        } as PartnerInquiryFormValues
    });

    const businessType = watch('business_type');

    return (
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8 max-w-2xl mx-auto py-8">
            <div className="space-y-2 text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">파트너 입점 신청</h2>
                <p className="text-gray-500">시설/업체 정보를 등록하고 추모맵 파트너가 되어보세요.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">업종 선택</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: 'funeral_home', label: '장례식장' },
                            { id: 'memorial_park', label: '추모시설' },
                            { id: 'sangjo', label: '상조회사' },
                            { id: 'pet_funeral', label: '동물장례' }
                        ].map((type) => (
                            <label key={type.id} className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${businessType === type.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}>
                                <input type="radio" value={type.id} {...register('business_type')} className="sr-only" />
                                <span className="text-sm font-bold">{type.label}</span>
                            </label>
                        ))}
                    </div>
                    {errors.business_type && <p className="text-red-500 text-xs mt-1">{errors.business_type.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">업체명</label>
                        <input {...register('company_name')} className="w-full p-3 border rounded-lg focus:ring-2 outline-none" placeholder="업체명 (상호)" />
                        {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">담당자명</label>
                        <input {...register('contact_person')} className="w-full p-3 border rounded-lg focus:ring-2 outline-none" placeholder="담당자 성함" />
                        {errors.contact_person && <p className="text-red-500 text-xs mt-1">{errors.contact_person.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                        <input {...register('contact_number')} className="w-full p-3 border rounded-lg focus:ring-2 outline-none" placeholder="010-0000-0000" />
                        {errors.contact_number && <p className="text-red-500 text-xs mt-1">{errors.contact_number.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                        <input {...register('email')} className="w-full p-3 border rounded-lg focus:ring-2 outline-none" placeholder="example@email.com" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl text-center text-sm text-gray-500">
                * 신청 후 담당자가 24시간 이내에 연락드립니다.
            </div>

            <button type="submit" disabled={!isValid} className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all ${isValid ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                입점 신청하기
            </button>
        </form>
    );
};
