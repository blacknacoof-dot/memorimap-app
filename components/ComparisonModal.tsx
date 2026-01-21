import { Facility, getCategoryLabel, normalizeCategoryValue } from '../types';
import { X, Star, MapPin, Trash2, AlertCircle } from 'lucide-react';

interface Props {
  facilities: Facility[];
  onClose: () => void;
  onRemove: (facilityId: string) => void;
  onBook: (facility: Facility) => void;
}

export const ComparisonModal: React.FC<Props> = ({ facilities, onClose, onRemove, onBook }) => {
  if (facilities.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">시설 비교하기</h2>
            <p className="text-xs text-gray-500">최대 3개 시설까지 비교 가능합니다.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="text-gray-500" />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto bg-gray-50">
          <div className="min-w-max p-4">
            <div className="flex gap-4">
              {facilities.map((facility) => (
                <div key={facility.id} className="w-[280px] bg-white rounded-xl shadow-sm border flex flex-col shrink-0">
                  {/* Image & Remove Action */}
                  <div className="relative h-40 w-full rounded-t-xl overflow-hidden group">
                    <img src={facility.imageUrl} alt={facility.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2">
                      <button
                        onClick={() => onRemove(facility.id)}
                        className="bg-white/90 p-1.5 rounded-full text-red-500 hover:bg-white shadow-sm transition-transform hover:scale-110"
                        title="비교함에서 제거"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {getCategoryLabel(normalizeCategoryValue(facility.category || facility.type))}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col gap-4">
                    {/* Header */}
                    <div>
                      <h3 className="font-bold text-lg leading-tight mb-1">{facility.name}</h3>
                      <div className="flex items-center text-yellow-500 gap-1 text-sm">
                        <Star size={14} fill="currentColor" />
                        <span className="font-bold text-gray-900">{facility.rating}</span>
                        <span className="text-gray-400 font-normal">({facility.reviewCount})</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-blue-600 mb-1 font-bold">분양 가격대</div>
                      <div className="text-sm font-bold text-gray-800">{facility.priceRange}</div>
                    </div>

                    {/* Location */}
                    <div>
                      <div className="text-xs text-gray-400 mb-1">위치</div>
                      <div className="flex items-start gap-1 text-sm text-gray-700 leading-snug">
                        <MapPin size={14} className="mt-0.5 shrink-0" />
                        {facility.address}
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <div className="text-xs text-gray-400 mb-1">주요 특징</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(facility.features || []).slice(0, 4).map(f => (
                          <span key={f} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Religion */}
                    <div>
                      <div className="text-xs text-gray-400 mb-1">종교 시설</div>
                      <div className="text-sm text-gray-700">
                        {facility.religion === 'christian' ? '기독교 전용' :
                          facility.religion === 'catholic' ? '천주교 전용' :
                            facility.religion === 'buddhism' ? '불교 전용' : '종교 무관'}
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="p-4 border-t mt-auto">
                    <button
                      onClick={() => onBook(facility)}
                      className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold shadow hover:bg-opacity-90 active:scale-95 transition-transform"
                    >
                      이곳으로 예약하기
                    </button>
                  </div>
                </div>
              ))}

              {/* Empty Placeholder if less than 2 items (Optional, just to show space) */}
              {facilities.length === 1 && (
                <div className="w-[280px] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 p-8 text-center shrink-0">
                  <AlertCircle size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">비교할 다른 시설을<br />추가해보세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};