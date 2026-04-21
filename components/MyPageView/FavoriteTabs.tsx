import React from 'react';
import { Heart, Search, Loader2 } from 'lucide-react';
import { Facility, FuneralCompany } from '../../types';
import type { Favorite } from '../../services/favoriteService';
import type { SangjoFavorite } from '../../services/sangjoFavoriteService';
import { FUNERAL_COMPANIES } from '../../constants';
import type { FavoriteTab } from './useMyPage';
import { FavoriteCard } from './FavoriteCard';
import { SangjoFavoriteCard } from './SangjoFavoriteCard';

interface Props {
  activeTab: FavoriteTab;
  setActiveTab: (t: FavoriteTab) => void;
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

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-xl border border-dashed">
    <Search size={32} className="mb-3 text-gray-300" />
    <p className="text-sm">{message}</p>
  </div>
);

export const FavoriteTabs: React.FC<Props> = ({
  activeTab, setActiveTab, myFavorites, isLoadingFavorites, extraFacilities, facilities,
  sangjoFavorites, isLoadingSangjoFavorites, onSelectFacility, onSelectCompany,
  onRemoveFavorite, onRemoveSangjoFavorite,
}) => {
  const tabClass = (tab: FavoriteTab, active: string) =>
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

      <div className="mb-4">
        {activeTab === 'favorites' && (
          isLoadingFavorites ? (
            <div className="text-center py-10"><Loader2 size={32} className="animate-spin text-primary mx-auto" /></div>
          ) : myFavorites.length === 0 ? (
            <EmptyState message="마음에 드는 시설을 찜해보세요" />
          ) : (
            <div className="space-y-3">
              {myFavorites.map(fav => {
                const facility = facilities.find(f => String(f.id) === String(fav.facility_id)) ||
                  extraFacilities.get(String(fav.facility_id));
                if (!facility) return null;
                return (
                  <FavoriteCard
                    key={fav.id}
                    facility={facility}
                    onSelect={onSelectFacility}
                    onRemove={onRemoveFavorite}
                  />
                );
              })}
            </div>
          )
        )}

        {activeTab === 'sangjo_favorites' && (
          isLoadingSangjoFavorites ? (
            <div className="text-center py-10"><Loader2 size={32} className="animate-spin text-primary mx-auto" /></div>
          ) : sangjoFavorites.length === 0 ? (
            <EmptyState message="상조 서비스를 비교하고 찜해보세요" />
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
                    <SangjoFavoriteCard
                      key={fav.id}
                      company={company}
                      addedDate={fav.created_at}
                      favId={fav.id}
                      onSelect={onSelectCompany}
                      onRemove={onRemoveSangjoFavorite}
                    />
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
