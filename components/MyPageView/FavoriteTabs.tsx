import React from 'react';
import { Heart, Star, Loader2 } from 'lucide-react';
import { Facility, FuneralCompany } from '../../types';
import type { Favorite } from '../../services/favoriteService';
import type { SangjoFavorite } from '../../services/sangjoFavoriteService';
import { FUNERAL_COMPANIES } from '../../constants';
import type { ActiveTab } from './useMyPage';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (t: ActiveTab) => void;
  myFavorites: Favorite[];
  isLoadingFavorites: boolean;
  extraFacilities: Map<string, Facility>;
  facilities: Facility[];
  sangjoFavorites: SangjoFavorite[];
  isLoadingSangjoFavorites: boolean;
  onSelectFacility?: (facility: Facility) => void;
  onSelectCompany?: (company: FuneralCompany) => void;
  onRemoveFavorite: (facilityId: string) => void;
  onRemoveSangjoFavorite: (favId: string, companyId: string) => void;
}

export const FavoriteTabs: React.FC<Props> = ({
  activeTab, setActiveTab, myFavorites, isLoadingFavorites, extraFacilities, facilities,
  sangjoFavorites, isLoadingSangjoFavorites, onSelectFacility, onSelectCompany,
  onRemoveFavorite, onRemoveSangjoFavorite,
}) => {
  const tabClass = (tab: ActiveTab, active: string) =>
    `flex-1 py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-sm ${
      activeTab === tab ? `${active} text-white` : 'bg-white text-gray-600 hover:bg-pink-50'
    }`;

  const uniqueSangjoCount = Array.from(new Set(
    sangjoFavorites.map(fav => {
      const company = FUNERAL_COMPANIES.find(c => c.id === fav.company_id) ||
        FUNERAL_COMPANIES.find(c => c.name === fav.company_name);
      return company?.id;
    }).filter(Boolean)
  )).length;

  return (
    <>
      <h3 className="font-bold mb-4 border-l-4 border-pink-500 pl-3">찜한 목록</h3>

      <div className="flex gap-1.5 mb-4">
        <button onClick={() => setActiveTab('favorites')} className={tabClass('favorites', 'bg-pink-500')} title="즐겨찾기 시설">
          <Heart size={14} fill={activeTab === 'favorites' ? 'currentColor' : 'none'} className="shrink-0" />
          <span className="whitespace-nowrap">시설 {myFavorites.length}</span>
        </button>
        <button onClick={() => setActiveTab('sangjo_favorites')} className={tabClass('sangjo_favorites', 'bg-pink-500')} title="즐겨찾기 상조">
          <Heart size={14} fill={activeTab === 'sangjo_favorites' ? 'currentColor' : 'none'} className="shrink-0" />
          <span className="whitespace-nowrap">상조 {uniqueSangjoCount}</span>
        </button>
      </div>

      <div className="mb-10">
        {activeTab === 'favorites' && (
          isLoadingFavorites ? (
            <div className="text-center py-10"><Loader2 size={32} className="animate-spin text-primary mx-auto" /></div>
          ) : myFavorites.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">즐겨찾기한 시설이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {myFavorites.map(fav => {
                const facility = facilities.find(f => String(f.id) === String(fav.facility_id)) ||
                  extraFacilities.get(String(fav.facility_id));
                if (!facility) return null;
                return (
                  <div
                    key={fav.id}
                    onClick={() => onSelectFacility?.(facility)}
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
                            onClick={(e) => { e.stopPropagation(); onRemoveFavorite(facility.id); }}
                            className="text-red-500 hover:bg-red-50 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full absolute top-1 right-1 z-10"
                            title="즐겨찾기 해제"
                          >
                            <Heart size={18} fill="currentColor" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{facility.address}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium">
                            {facility.type === 'charnel' ? '봉안시설' :
                             facility.type === 'natural' ? '자연장' :
                             facility.type === 'funeral' ? '장례식장' :
                             facility.type === 'sea' ? '해양장' :
                             facility.type === 'pet' ? '동물장' : '공원묘지'}
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
              })}
            </div>
          )
        )}

        {activeTab === 'sangjo_favorites' && (
          isLoadingSangjoFavorites ? (
            <div className="text-center py-10"><Loader2 size={32} className="animate-spin text-primary mx-auto" /></div>
          ) : sangjoFavorites.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">즐겨찾기한 상조 회사가 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const seenIds = new Set<string>();
                return sangjoFavorites.map(fav => {
                  const company = FUNERAL_COMPANIES.find(c => c.id === fav.company_id) ||
                    FUNERAL_COMPANIES.find(c => c.name === fav.company_name);
                  if (!company || seenIds.has(company.id)) return null;
                  seenIds.add(company.id);
                  return (
                    <div
                      key={fav.id}
                      onClick={() => onSelectCompany?.(company)}
                      className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow relative cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          <img src={company.imageUrl} alt={company.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-900 truncate pr-6">{company.name}</h3>
                            <button
                              onClick={(e) => { e.stopPropagation(); onRemoveSangjoFavorite(fav.id, company.id); }}
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
                              {new Date(fav.created_at).toLocaleDateString()} 추가
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )
        )}
      </div>
    </>
  );
};
