import React from 'react';
import { Heart, Star } from 'lucide-react';
import { FuneralCompany } from '../../types';

interface Props {
  company: FuneralCompany;
  addedDate: string;
  favId: string;
  onSelect?: (company: FuneralCompany) => void;
  onRemove: (favId: string, companyId: string) => void;
}

export const SangjoFavoriteCard: React.FC<Props> = ({ company, addedDate, favId, onSelect, onRemove }) => (
  <div
    onClick={() => onSelect?.(company)}
    className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow relative cursor-pointer active:scale-[0.98]"
  >
    <div className="flex gap-4">
      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
        <img src={company.imageUrl} alt={company.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-gray-900 break-all line-clamp-2 pr-6">{company.name}</h3>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(favId, company.id); }}
            className="text-red-500 hover:bg-red-50 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full absolute top-1 right-1 z-10"
            title="즐겨찾기 해제"
          >
            <Heart size={18} fill="currentColor" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">{company.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center text-xs text-yellow-500 font-bold">
            <Star size={12} fill="currentColor" />
            <span className="ml-0.5">{company.rating}</span>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(addedDate).toLocaleDateString()} 추가
          </span>
        </div>
      </div>
    </div>
  </div>
);
