import React from 'react';
import { Heart, Star } from 'lucide-react';
import { Facility } from '../../types';

const TYPE_LABELS: Record<string, string> = {
  charnel: '봉안시설',
  natural: '자연장',
  funeral: '장례식장',
  sea: '해양장',
  pet: '동물장',
};

interface Props {
  facility: Facility;
  onSelect?: (facility: Facility) => void;
  onRemove: (facilityId: string) => void;
}

export const FavoriteCard: React.FC<Props> = ({ facility, onSelect, onRemove }) => (
  <div
    onClick={() => onSelect?.(facility)}
    className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow relative cursor-pointer active:scale-[0.98]"
  >
    <div className="flex gap-4">
      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
        {facility.imageUrl
          ? <img src={facility.imageUrl} alt={facility.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-gray-900 truncate pr-6">{facility.name}</h3>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(facility.id); }}
            className="text-red-500 hover:bg-red-50 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full absolute top-1 right-1 z-10"
            title="즐겨찾기 해제"
          >
            <Heart size={18} fill="currentColor" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1 truncate">{facility.address}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium">
            {TYPE_LABELS[facility.type || ''] || '공원묘지'}
          </span>
          <div className="flex items-center text-xs text-yellow-500 font-bold">
            <Star size={12} fill="currentColor" />
            <span className="ml-0.5">{Math.round(facility.rating || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
