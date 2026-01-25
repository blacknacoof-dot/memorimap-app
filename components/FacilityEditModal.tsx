import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Building2, MapPin, Phone, FileText, DollarSign, ImagePlus, Trash2, Plus } from 'lucide-react';
import { updateFacility, uploadFacilityImage } from '../lib/queries';
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
    const [description, setDescription] = useState(facility.description || '');
    const [priceRange, setPriceRange] = useState(facility.priceRange || '');
    const [imageUrl, setImageUrl] = useState(facility.imageUrl || '');
    const [galleryImages, setGalleryImages] = useState<string[]>(facility.galleryImages || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setName(facility.name);
        setAddress(facility.address);
        setPhone(facility.phone);
        setDescription(facility.description || '');
        setPriceRange(facility.priceRange || '');
        setImageUrl(facility.imageUrl || '');
        setGalleryImages(facility.galleryImages || []);
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

    const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadFacilityImage(facility.id, file);
            setImageUrl(url);
        } catch (error) {
            console.error('Main image upload failed:', error);
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadFacilityImage(facility.id, file);
            setGalleryImages(prev => [...prev, url]);
        } catch (error) {
            console.error('Gallery image upload failed:', error);
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveGalleryImage = (index: number) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
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
                price_range: priceRange,
                image_url: imageUrl,
                images: galleryImages
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

                    <hr className="border-gray-100" />

                    {/* Image Management */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            📸 이미지 관리
                            {isUploading && <Loader2 size={16} className="animate-spin text-primary" />}
                        </label>

                        {/* Main Image */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700">대표 이미지</label>
                            <div className="flex gap-4 items-center">
                                {imageUrl ? (
                                    <div className="relative w-32 h-24 rounded-lg overflow-hidden border">
                                        <img src={imageUrl} alt="Main" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setImageUrl('')}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="w-32 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <ImagePlus size={24} className="text-gray-400 mb-1" />
                                        <span className="text-[10px] text-gray-500">이미지 추가</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleMainImageChange}
                                        />
                                    </label>
                                )}
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-500">목록에서 가장 먼저 보여지는 대표 사진입니다.</p>
                                </div>
                            </div>
                        </div>

                        {/* Gallery Images */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700">갤러리 사진 {galleryImages.length}/3</label>
                            <div className="grid grid-cols-4 gap-2">
                                {galleryImages.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border group">
                                        <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveGalleryImage(idx)}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {galleryImages.length < 3 && (
                                    <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <Plus size={24} className="text-gray-400" />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAddGalleryImage}
                                        />
                                    </label>
                                )}
                            </div>
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
