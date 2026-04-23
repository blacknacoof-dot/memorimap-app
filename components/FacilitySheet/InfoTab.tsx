import React from 'react';
import { Star, MapPin, Heart, ChevronRight, Phone, Clock, Award, Gift } from 'lucide-react';
import { Facility } from '../../types';
import { getSmartFeatures, getSmartDescription } from '../../lib/facilityUtils';

interface Props {
  facility: Facility;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onViewMap?: () => void;
  onViewPhotos: () => void;
  onOpenAiChat?: () => void;
  onViewSangjoList?: () => void;
  onClose: () => void;
  onLightboxOpen: (index: number) => void;
}

export const InfoTab: React.FC<Props> = ({
  facility, isFavorite, onToggleFavorite, onViewMap, onViewPhotos,
  onViewSangjoList, onClose, onLightboxOpen,
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-start">
      <div>
        <div className="flex items-center gap-1 text-yellow-500 mb-1">
          <Star size={16} fill="currentColor" />
          <span className="font-bold text-black">{Math.round(facility.rating || 0)}</span>
          <span className="text-gray-400 text-sm">({facility.reviewCount || 0}개 리뷰)</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <MapPin size={16} />
          <span>{facility.address}</span>
          {onViewMap && (
            <button
              onClick={onViewMap}
              className="text-primary text-xs font-bold border border-primary px-2 py-0.5 rounded-full ml-1 whitespace-nowrap min-w-fit"
            >
              지도 보기
            </button>
          )}
        </div>
      </div>
      <button
        onClick={onToggleFavorite}
        className={`transition-colors ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
      >
        <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </div>

    {facility.galleryImages && facility.galleryImages.length > 0 && (
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800">시설 둘러보기</h3>
          <button onClick={onViewPhotos} className="text-xs text-primary flex items-center gap-0.5 hover:underline font-medium">
            더보기 <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
          {facility.galleryImages.map((img, idx) => (
            <img
              key={idx} src={img} alt={`preview-${idx}`}
              className="w-32 h-24 object-cover rounded-lg flex-none snap-start cursor-pointer hover:opacity-90 active:scale-95 transition-transform border border-gray-100"
              onClick={() => onLightboxOpen(idx)}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ))}
        </div>
      </div>
    )}

    <div>
      <h3 className="font-bold mb-2 text-gray-800">시설 소개</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{getSmartDescription(facility)}</p>
    </div>

    <div>
      <h3 className="font-bold mb-2 text-gray-800">편의시설 및 특징</h3>
      <div className="flex flex-wrap gap-2">
        {getSmartFeatures(facility).map((feature, idx) => (
          <span key={idx} className="bg-secondary text-primary px-3 py-1 rounded-full text-xs font-medium">{feature}</span>
        ))}
      </div>
    </div>

    <div className="bg-gray-50 p-4 rounded-xl space-y-3">
      <div className="flex items-center gap-3">
        <Phone className="text-gray-400" size={18} />
        <span className="text-sm">{facility.phone}</span>
      </div>
      <div className="flex items-center gap-3">
        <Clock className="text-gray-400" size={18} />
        <span className="text-sm">{facility.operating_hours || '09:00 - 18:00 (연중무휴)'}</span>
      </div>
    </div>

    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200">
      <div className="flex items-center gap-2 mb-4">
        <Award className="text-amber-600" size={20} />
        <h3 className="font-bold text-amber-900">제휴 상조 패키지 혜택</h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm border border-amber-100 mt-0.5">
            <Gift size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900 mb-0.5">상조 + 장지 결합 할인</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              제휴 상조회사를 통해 방문 예약 시 <strong>분양가 5% 추가 할인</strong> 및 <strong>10만원 상당의 추모 꽃다발</strong>을 증정합니다.
            </p>
          </div>
        </div>
        <button
          onClick={() => { onClose(); onViewSangjoList?.(); }}
          className="w-full py-2.5 bg-white border border-amber-300 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
        >
          제휴 상조회사 리스트 보기 <ChevronRight size={14} />
        </button>
      </div>
    </div>
  </div>
);
