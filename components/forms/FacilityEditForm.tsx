import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MemorialSpaceSchema, MemorialSpaceFormValues } from '../../lib/schemas';
import { MemorialSpace } from '../../types/db';

// 상조는 시설 편집 폼 대상이 아님 → 물리적 시설 카테고리만 허용
const toPhysicalCategory = (cat: string | undefined): MemorialSpaceFormValues['category'] => {
    if (!cat || cat === 'sangjo' || cat === '상조') return 'funeral_home';
    return cat as MemorialSpaceFormValues['category'];
};

interface Props {
    initialData?: MemorialSpace;
    onSubmit: (data: MemorialSpaceFormValues) => void;
    onCancel: () => void;
}

export const FacilityEditForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<MemorialSpaceFormValues>({
        resolver: zodResolver(MemorialSpaceSchema),
        defaultValues: {
            id: initialData?.id,
            name: initialData?.name || '',
            address: initialData?.address || '',
            category: toPhysicalCategory(initialData?.category),
            verified: initialData?.verified ?? false,
            ai_context: initialData?.ai_context || undefined,
            ai_features: initialData?.ai_features || []
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                id: initialData.id,
                name: initialData.name,
                address: initialData.address,
                category: toPhysicalCategory(initialData.category),
                verified: initialData.verified,
                ai_context: initialData.ai_context || undefined,
                ai_features: initialData.ai_features || []
            });
        }
    }, [initialData, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit as (data: MemorialSpaceFormValues) => void)} className="space-y-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">시설 정보 수정</h3>

                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">시설명</label>
                        <input {...register('name')} className="w-full p-3 border rounded-lg focus:ring-2 outline-none" placeholder="시설명 입력" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                        <input {...register('address')} className="w-full p-3 border rounded-lg focus:ring-2 outline-none" placeholder="주소 입력" />
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">시설 유형</label>
                        <select {...register('category')} className="w-full p-3 border rounded-lg focus:ring-2 outline-none bg-white">
                            <option value="funeral_home">장례식장</option>
                            <option value="columbarium">봉안시설</option>
                            <option value="natural_burial">수목장/자연장</option>
                            <option value="cemetery">복합 추모공원</option>
                            <option value="pet_funeral">반려동물 장례식장</option>
                            <option value="sea_burial">해양장</option>
                        </select>
                    </div>
                </div>

                <hr className="my-6 border-gray-100" />

                {/* AI Context */}
                <div>
                    <h4 className="text-md font-bold text-gray-900 mb-2">AI 상담 설정</h4>
                    <p className="text-xs text-gray-500 mb-3">AI 상담원이 고객 응대 시 참고할 정보를 입력해주세요.</p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">AI 지식 베이스 (Context)</label>
                        <textarea
                            {...register('ai_context')}
                            className="w-full p-3 border rounded-lg h-32 resize-none outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="예: 저희 시설은 500대 주차가 가능하며, 매점과 카페가 1층에 위치해 있습니다. 면회 시간은 09:00~18:00 입니다."
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-3 justify-end">
                <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl border font-medium hover:bg-gray-50">
                    취소
                </button>
                <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg">
                    저장하기
                </button>
            </div>
        </form>
    );
};
