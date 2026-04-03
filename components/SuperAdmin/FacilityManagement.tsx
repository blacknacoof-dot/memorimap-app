import React, { useState, useEffect, useCallback } from 'react';
import { useAllFacilities, AdminFacility } from '../../hooks/useAdminFacilities';
import { useAllUsers } from '../../hooks/useUsers';
import { Search, Building2, MapPin, User, Edit2, AlertCircle, Camera, Phone, FileText } from 'lucide-react';

export function FacilityManagement({ initialSearch, onClearSearch }: { initialSearch?: string; onClearSearch?: () => void }) {
    const { facilities, loading, totalCount, page, itemsPerPage, search, updateManager } = useAllFacilities();
    const { users } = useAllUsers();

    const [searchTerm, setSearchTerm] = useState(initialSearch || '');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempManagerId, setTempManagerId] = useState<string>('');
    const [hasSearched, setHasSearched] = useState(!!initialSearch);

    // handleSearch의 정의를 위로 올리고 useCallback으로 감쌉니다.
    const handleSearch = useCallback(async (targetPage: number = 0, val?: string) => {
        const queryTerm = val === undefined ? searchTerm : val;
        setHasSearched(true);
        await search(queryTerm, targetPage);
    }, [searchTerm, search]);

    // Initial Search Logic — handleSearch 내부의 setHasSearched는 의도적 동기 호출
    useEffect(() => {
        const offset = 0;
        const term = initialSearch || '';
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handleSearch(offset, term);
    }, [initialSearch, handleSearch]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const filteredFacilities = facilities;

    // Facility Admins only for dropdown
    const adminCandidates = users.filter(u => u.role === 'facility_admin');

    const handleStartEdit = (f: AdminFacility) => {
        setEditingId(f.id);
        setTempManagerId(f.user_id || '');
    };

    const handleSave = async (facilityId: string) => {
        const finalId = tempManagerId === '' ? null : tempManagerId;
        await updateManager(facilityId, finalId);
        setEditingId(null);
    };

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                <div className="flex-1 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
                    <Search className="text-gray-400" size={18} />
                    <input
                        data-testid="facility-management-search-input"
                        id="facility-search"
                        name="facility-search"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(0)}
                        placeholder="시설명 검색 (엔터)"
                        className="bg-transparent outline-none text-sm w-full"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleSearch(0)} className="flex-1 sm:flex-none text-sm bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black transition font-bold">
                        검색
                    </button>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setHasSearched(true);
                            search('', 0);
                            onClearSearch?.();
                        }}
                        className="text-xs text-blue-600 hover:underline px-2 whitespace-nowrap"
                    >
                        전체보기
                    </button>
                </div>
            </div>

            {/* Total Count Info */}
            <div className="flex justify-between items-center px-1">
                <p className="text-xs text-gray-500">
                    전체 <span className="font-bold text-gray-900">{totalCount.toLocaleString()}</span>개 시설 중
                    <span className="font-bold text-gray-900"> {page * itemsPerPage + 1}-{Math.min((page + 1) * itemsPerPage, totalCount)}</span> 표시
                </p>
            </div>

            {/* Warning for admins */}
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2 text-xs text-amber-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>
                    시설 관리자를 지정하려면 해당 유저의 권한이 먼저 <strong>Facility Admin</strong>이어야 합니다.<br />
                    '유저 관리' 탭에서 권한을 먼저 부여한 후 이곳에서 할당해주세요.
                </p>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-2 text-center py-10">데이터 로딩 중...</div>
                ) : !hasSearched ? (
                    <div className="col-span-2 text-center py-20 text-gray-400 bg-gray-50 rounded-xl border border-dashed text-sm">
                        <Search className="mx-auto mb-2 opacity-50" />
                        시설명을 입력하여 검색해주세요.
                    </div>
                ) : filteredFacilities.length === 0 ? (
                    <div className="col-span-2 text-center py-10">결과가 없습니다.</div>
                ) : (
                    filteredFacilities.map((f: AdminFacility) => (
                        <div
                            key={f.id}
                            data-testid={`admin-facility-card-${f.id}`}
                            className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2 truncate" title={f.name}>
                                        <Building2 size={16} className="text-primary shrink-0" />
                                        <span className="truncate">{f.name}</span>
                                    </h3>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 truncate" title={f.address}>
                                        <MapPin size={12} className="shrink-0" />
                                        <span className="truncate">{f.address}</span>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border shrink-0 ml-2">
                                    {f.type || f.category || '기타'}
                                </span>
                            </div>

                            {/* 데이터 완성도 */}
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                                {(() => {
                                    const hasPhotos = f.images && Array.isArray(f.images) && f.images.length > 0;
                                    const hasPhone = !!f.phone;
                                    const hasDesc = !!f.description;
                                    const score = [hasPhotos, hasPhone, hasDesc].filter(Boolean).length;
                                    const pct = Math.round((score / 3) * 100);
                                    return (
                                        <>
                                            <span title={hasPhotos ? '사진 있음' : '사진 없음'}><Camera size={13} className={hasPhotos ? 'text-green-500' : 'text-red-400'} /></span>
                                            <span title={hasPhone ? '연락처 있음' : '연락처 없음'}><Phone size={13} className={hasPhone ? 'text-green-500' : 'text-red-400'} /></span>
                                            <span title={hasDesc ? '설명 있음' : '설명 없음'}><FileText size={13} className={hasDesc ? 'text-green-500' : 'text-red-400'} /></span>
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${pct === 100 ? 'bg-green-100 text-green-700' : pct >= 66 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                {pct}%
                                            </span>
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50">
                                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                                    <User size={12} />
                                    담당 관리자 (Owner)
                                </p>

                                {editingId === f.id ? (
                                    <div className="flex gap-2">
                                        <select
                                            data-testid={`admin-facility-manager-select-${f.id}`}
                                            value={tempManagerId}
                                            onChange={(e) => setTempManagerId(e.target.value)}
                                            className="flex-1 text-sm border rounded px-2 py-1"
                                        >
                                            <option value="">(관리자 없음)</option>
                                            {adminCandidates.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.full_name} ({u.email})
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            data-testid={`admin-facility-manager-save-${f.id}`}
                                            onClick={() => handleSave(f.id)}
                                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                        >
                                            저장
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300"
                                        >
                                            취소
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center group">
                                        <div className="text-sm">
                                            {f.user_id ? (
                                                <span className="text-blue-600 font-medium">
                                                    {users.find(u => u.id === f.user_id)?.full_name ||
                                                        users.find(u => u.id === f.user_id)?.email ||
                                                        'ID: ' + f.user_id.substring(0, 8) + '...'}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">지정되지 않음</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleStartEdit(f)}
                                            data-testid={`admin-facility-edit-${f.id}`}
                                            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-300 hover:text-primary transition-colors"
                                            title="관리자 변경"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-4">
                    <button
                        onClick={() => handleSearch(page - 1)}
                        disabled={page === 0 || loading}
                        className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        이전
                    </button>
                    <span className="text-sm text-gray-600 font-medium">
                        {page + 1} / {totalPages} 페이지
                    </span>
                    <button
                        onClick={() => handleSearch(page + 1)}
                        disabled={page >= totalPages - 1 || loading}
                        className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        다음
                    </button>
                </div>
            )}
        </div>
    );
}
