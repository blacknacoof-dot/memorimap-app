import React, { useState, useEffect } from 'react';
import { getPendingFacilities, approveFacility, rejectFacility } from '../../lib/queries';
import { CheckCircle, XCircle, Search, FileText, Phone, MapPin, Building2 } from 'lucide-react';

interface PendingFacility {
    id: string;
    name: string;
    type: string;
    address: string;
    phone: string;
    businessLicenseImage: string | null;
    createdAt: string;
    ownerUserId: string;
}

export const PartnerAdmissions: React.FC = () => {
    const [facilities, setFacilities] = useState<PendingFacility[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadFacilities();
    }, []);

    const loadFacilities = async () => {
        setIsLoading(true);
        try {
            const data = await getPendingFacilities();
            setFacilities(data);
        } catch (error) {
            console.error(error);
            alert('대기 중인 업체 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: string, name: string) => {
        if (!confirm(`${name} 업체의 입점을 승인하시겠습니까?`)) return;
        try {
            await approveFacility(id);
            alert('승인되었습니다.');
            loadFacilities();
        } catch (error) {
            console.error('Approve failed:', error);
            alert('승인 처리 중 오류가 발생했습니다.');
        }
    };

    const handleReject = async (id: string, name: string) => {
        if (!confirm(`${name} 업체의 입점을 거절(삭제)하시겠습니까?`)) return;
        try {
            await rejectFacility(id);
            alert('거절(삭제)되었습니다.');
            loadFacilities();
        } catch (error) {
            console.error('Reject failed:', error);
            alert('거절 처리 중 오류가 발생했습니다.');
        }
    };

    const [selectedTab, setSelectedTab] = useState('all');

    const filtered = facilities.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.address.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (selectedTab === 'all') return true;
        if (selectedTab === 'funeral' && f.type === 'funeral_home') return true; // Map from input value
        if (selectedTab === 'funeral' && f.type === 'funeral') return true;
        if (selectedTab === 'memorial' && (f.type === 'memorial_park' || f.type === 'charnel' || f.type === 'natural' || f.type === 'complex')) return true;
        if (selectedTab === 'sangjo' && (f.type === 'sangjo')) return true;
        if (selectedTab === 'pet' && f.type === 'pet') return true;

        return false;
    });

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-2">
                <Search className="text-gray-400" size={20} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="업체명, 주소 검색..."
                    className="flex-1 outline-none text-sm"
                />
                <div onClick={loadFacilities} className="cursor-pointer p-2 hover:bg-gray-100 rounded-full" title="새로고침">
                    <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
                        승인 대기 중인 업체가 없습니다.
                    </div>
                ) : (
                    filtered.map(f => (
                        <div key={f.id} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:border-blue-200 transition-colors">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900">{f.name}</h3>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200 font-medium">
                                        {f.type}
                                    </span>
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded border border-amber-100 font-bold flex items-center gap-1">
                                        <FileText size={10} /> 서류 검토 필요
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 space-y-1">
                                    <p className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" /> {f.address}</p>
                                    <p className="flex items-center gap-1.5"><Phone size={14} className="text-gray-400" /> {f.phone || '전화번호 없음'}</p>
                                    <p className="flex items-center gap-1.5"><Building2 size={14} className="text-gray-400" /> 신청일: {new Date(f.createdAt).toLocaleDateString()}</p>
                                </div>
                                {f.businessLicenseImage && (
                                    <a href={f.businessLicenseImage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                                        <FileText size={12} /> 사업자등록증 보기
                                    </a>
                                )}
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => handleApprove(f.id, f.name)}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm transition-colors shadow-sm"
                                >
                                    <CheckCircle size={16} /> 승인
                                </button>
                                <button
                                    onClick={() => handleReject(f.id, f.name)}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-white text-gray-500 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 font-medium text-sm transition-colors"
                                >
                                    <XCircle size={16} /> 거절
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
