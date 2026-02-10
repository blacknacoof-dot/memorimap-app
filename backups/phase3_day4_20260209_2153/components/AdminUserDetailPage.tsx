import React from 'react';
import { ChevronLeft, Calendar } from 'lucide-react';
import { useAdminUserFavorites } from '@/hooks/useFavorites';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface Props {
    userId: string;
    onBack: () => void;
}

export const AdminUserDetailPage: React.FC<Props> = ({ userId, onBack }) => {
    const { data: userFavorites, isLoading, error } = useAdminUserFavorites(userId || '');

    if (!userId) return <div>Invalid User ID</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-white rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold">사용자 상세 정보</h1>
            </div>

            <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        ❤️ 찜한 시설 목록
                        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {userFavorites?.length || 0}개
                        </span>
                    </h2>
                </div>

                {isLoading ? (
                    <div className="text-center py-10 text-gray-400">Loading...</div>
                ) : error ? (
                    <div className="text-center py-10 text-red-500">Error loading favorites</div>
                ) : userFavorites && userFavorites.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userFavorites.map((fav) => (
                            <div key={fav.id} className="border rounded-xl p-4 hover:border-pink-200 transition-colors bg-white">
                                <div className="flex gap-3">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                        {fav.facility_image_url ? (
                                            <OptimizedImage src={fav.facility_image_url} alt={fav.facility_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{fav.facility_name}</h3>
                                        <p className="text-xs text-gray-500 mb-1">{fav.facility_category}</p>
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                            <Calendar size={10} />
                                            {new Date(fav.created_at).toLocaleDateString()} 찜
                                        </p>
                                    </div>
                                </div>

                                {(fav.private_memo || fav.private_rating) && (
                                    <div className="mt-3 bg-gray-50 p-2 rounded-lg space-y-1">
                                        {fav.private_rating && (
                                            <div className="text-xs font-bold text-yellow-600">
                                                ⭐ 평점: {fav.private_rating}점
                                            </div>
                                        )}
                                        {fav.private_memo && (
                                            <div className="text-xs text-gray-700">
                                                📝 {fav.private_memo}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                        찜한 시설이 없습니다.
                    </div>
                )}
            </section>
        </div>
    );
};
