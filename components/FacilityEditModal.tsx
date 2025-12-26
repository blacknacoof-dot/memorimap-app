import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Building2, MapPin, Phone, FileText, DollarSign } from 'lucide-react';
import { updateFacility } from '../lib/queries';
import { Facility } from '../types';

interface Props {
    facility: Facility;
    onClose: () => void;
    onSave: () => void;
}

export const FacilityEditModal: React.FC<Props> = ({ facility, onClose, onSave }) => {
    const [name, setName] = useState(facility.name);
    const [address, setAddress] = useState(facility.address);
    const [phone, setPhone] = useState(facility.phone);
    const [description, setDescription] = useState(facility.description);
    const [priceRange, setPriceRange] = useState(facility.priceRange);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setName(facility.name);
        setAddress(facility.address);
        setPhone(facility.phone);
        setDescription(facility.description);
        setPriceRange(facility.priceRange);
    }, [facility]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 3 && value.length <= 7) {
            value = value.replace(/(\d{2,3})(\d{1,4})/, '$1-$2');
        } else if (value.length > 7) {
            value = value.replace(/(\d{2,3})(\d{3,4})(\d{4})/, '$1-$2-$3');
        }

        setPhone(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updateFacility(facility.id, {
                name,
                address,
                phone,
                description,
                price_range: priceRange
            });
            onSave();
            onClose();
            alert('시설 정보가 성공적으로 수정되었습니다.');
        } catch (error) {
            console.error('Failed to update facility:', error);
            alert('시설 정보 수정 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-bold text-gray-900">시설 정보 수정</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Facility Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">시설 이름 *</label>
                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900"
                                placeholder="시설 이름을 입력하세요"
                                required
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">주소 *</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900"
                                placeholder="주소를 입력하세요"
                                required
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">전화번호</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="tel"
                                value={phone}
                                onChange={handlePhoneChange}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900"
                                placeholder="02-0000-0000"
                            />
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">가격 범위</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={priceRange}
                                onChange={(e) => setPriceRange(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900"
                                placeholder="예: 100만원 ~ 500만원"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">시설 설명</label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-4 text-gray-400" size={18} />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900 min-h-[100px] resize-none"
                                placeholder="시설에 대한 설명을 입력하세요"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 active:scale-[0.98] transition-all"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-primary text-white py-3 rounded-xl font-bold shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    저장 중...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    저장하기
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
