import React, { useState } from 'react';
import { useAllFacilities } from '../../hooks/useAdminFacilities';
import { useAllUsers } from '../../hooks/useUsers';
import { Search, Building2, MapPin, User, Edit2, AlertCircle } from 'lucide-react';

export const FacilityManagement: React.FC = () => {
    const { facilities, loading, search, updateManager } = useAllFacilities();
    const { users } = useAllUsers();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null); // Changed to string for UUID
    const [tempManagerId, setTempManagerId] = useState<string>('');
    const [hasSearched, setHasSearched] = useState(false);

    const filteredFacilities = facilities; // Filtering is done by DB search now

    const handleSearch = async () => {
        if (!searchTerm) return;
        setHasSearched(true);
        await search(searchTerm);
    };

    // Facility Admins only for dropdown
    const adminCandidates = users.filter(u => u.role === 'facility_admin');

    const handleStartEdit = (f: any) => {
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
            <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4">
                <div className="flex-1 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
                    <Search className="text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="시설명 검색 (엔터)"
                        className="bg-transparent outline-none text-sm w-full"
                    />
                </div>
                <button onClick={handleSearch} className="text-sm bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-black transition">
                    검색
                </button>
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
                    <div className="col-span-2 text-center py-10">검색 중...</div>
                ) : !hasSearched ? (
                    <div className="col-span-2 text-center py-20 text-gray-400 bg-gray-50 rounded-xl border border-dashed text-sm">
                        <Search className="mx-auto mb-2 opacity-50" />
                        시설명을 입력하여 검색해주세요.
                    </div>
                ) : filteredFacilities.length === 0 ? (
                    <div className="col-span-2 text-center py-10">검색 결과가 없습니다.</div>
                ) : (
                    filteredFacilities.map(f => (
                        <div key={f.id} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        <Building2 size={16} className="text-primary" />
                                        {f.name}
                                    </h3>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                        <MapPin size={12} />
                                        {f.address}
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border">
                                    {f.category || f.type || '기타'}
                                </span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50">
                                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                                    <User size={12} />
                                    담당 관리자 (Owner)
                                </p>

                                {editingId === f.id ? (
                                    <div className="flex gap-2">
                                        <select
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
                                            className="text-gray-300 hover:text-primary transition-colors"
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
        </div>
    );
};
