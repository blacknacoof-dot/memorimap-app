import React from 'react';
import { FuneralCompany } from '../../../types';
import { Camera } from 'lucide-react';

interface GalleryTabProps {
    company: FuneralCompany;
}

export const GalleryTab: React.FC<GalleryTabProps> = ({ company }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">갤러리</h3>
                <span className="text-xs text-gray-400">총 {company.galleryImages?.length || 0}장</span>
            </div>

            {company.galleryImages && company.galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                    {company.galleryImages.map((img, idx) => (
                        <div
                            key={idx}
                            className="aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
                            onClick={() => window.open(img, '_blank', 'noopener,noreferrer')}
                        >
                            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                    <Camera size={48} className="mb-4 opacity-20" />
                    <p className="text-sm">등록된 갤러리 이미지가 없습니다.</p>
                </div>
            )}
        </div>
    );
};
