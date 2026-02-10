import React, { useState, useEffect } from 'react';
import { XCircle, Search as SearchIcon, Building2, MapPin, PlusCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    inquiryData: {
        company_name: string;
        type: string;
        target_facility_id?: string;
    } | null;
    onConfirm: (facilityId: string | null) => void; // null means "Create New"
}

export const FacilityMappingModal: React.FC<Props> = ({ isOpen, onClose, inquiryData, onConfirm }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<string | null>(null);

    // Initial search when modal opens
    useEffect(() => {
        if (isOpen && inquiryData) {
            setSearchTerm(inquiryData.company_name);
            handleSearch(inquiryData.company_name);
        }
    }, [isOpen, inquiryData]);

    const handleSearch = async (query: string) => {
        if (!query) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('memorial_spaces')
                .select('id, name, address, type, owner_user_id')
                .ilike('name', `%${query}%`)
                .limit(10);

            if (error) throw error;
            setSearchResults(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !inquiryData) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">시설 연결 및 승인</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            신청 업체: <span className="font-bold text-slate-900">{inquiryData.company_name}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <XCircle size={18} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-4 bg-white space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="시설명 검색..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (e.target.value.length >= 2) handleSearch(e.target.value);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                        />
                    </div>

                    {/* Results List */}
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {isLoading ? (
                            <div className="py-8 text-center text-slate-400 text-sm">검색 중...</div>
                        ) : searchResults.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-sm">
                                검색된 시설이 없습니다.
                            </div>
                        ) : (
                            searchResults.map(facility => (
                                <button
                                    key={facility.id}
                                    onClick={() => setSelectedFacility(facility.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${selectedFacility === facility.id
                                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                            : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedFacility === facility.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            <Building2 size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`font-bold truncate ${selectedFacility === facility.id ? 'text-blue-900' : 'text-slate-900'}`}>
                                                {facility.name}
                                            </p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                                                <MapPin size={10} /> {facility.address}
                                            </p>
                                        </div>
                                    </div>
                                    {facility.owner_user_id ? (
                                        <span className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-full font-bold whitespace-nowrap">
                                            이미 관리자 있음
                                        </span>
                                    ) : (
                                        selectedFacility === facility.id && <CheckCircle size={18} className="text-blue-500" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-2 text-xs text-slate-400">또는</span>
                        </div>
                    </div>

                    {/* Create New Option */}
                    <button
                        onClick={() => setSelectedFacility('CREATE_NEW')}
                        className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all ${selectedFacility === 'CREATE_NEW'
                                ? 'bg-green-50 border-green-500 text-green-700'
                                : 'border-slate-300 text-slate-500 hover:border-green-400 hover:text-green-600 hover:bg-green-50/50'
                            }`}
                    >
                        <PlusCircle size={20} />
                        <span className="font-bold">신규 시설로 등록 및 승인</span>
                    </button>
                    {selectedFacility === 'CREATE_NEW' && (
                        <p className="text-xs text-center text-green-600 mt-1">
                            입력된 정보(업체명, 전화번호 등)로 새 시설을 생성하고 승인합니다.
                        </p>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={() => {
                            if (selectedFacility === 'CREATE_NEW') onConfirm(null);
                            else if (selectedFacility) onConfirm(selectedFacility);
                        }}
                        disabled={!selectedFacility}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        선택 완료 및 승인
                    </button>
                </div>
            </div>
        </div>
    );
};
