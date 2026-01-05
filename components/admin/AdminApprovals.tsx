import React, { useEffect, useState } from 'react';
import { getPendingFacilities, approveFacility, rejectFacility } from '../lib/queries';
import { Loader2, Check, X, FileText, Building2 } from 'lucide-react';

export const AdminApprovals: React.FC = () => {
    const [facilities, setFacilities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        const data = await getPendingFacilities();
        setFacilities(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApprove = async (id: string, name: string) => {
        if (confirm(`${name} 업체의 입점을 승인하시겠습니까?`)) {
            await approveFacility(id);
            alert('승인되었습니다.');
            loadData();
        }
    };

    const handleReject = async (id: string, name: string) => {
        if (confirm(`${name} 업체의 입점을 거절(삭제)하시겠습니까?`)) {
            await rejectFacility(id);
            alert('거절되었습니다.');
            loadData();
        }
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="text-blue-600" /> 입점 승인 대기 ({facilities.length})
            </h2>

            {facilities.length === 0 ? (
                <div className="bg-white p-12 rounded-xl text-center text-gray-400 border border-dashed">
                    대기 중인 입점 신청 내역이 없습니다.
                </div>
            ) : (
                <div className="grid gap-4">
                    {facilities.map((f) => (
                        <div key={f.id} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900">{f.name}</h3>
                                <div className="text-sm text-gray-500 mt-1 space-y-1">
                                    <p>📍 {f.address}</p>
                                    <p>📞 {f.phone || '전화번호 없음'}</p>
                                    <p>🕒 신청일: {new Date(f.createdAt).toLocaleDateString()}</p>
                                </div>
                                {f.businessLicenseImage && (
                                    <button
                                        onClick={() => setSelectedImage(f.businessLicenseImage)}
                                        className="mt-3 text-xs bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-200 text-blue-600 font-medium"
                                    >
                                        <FileText size={14} /> 사업자 등록증 확인
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => handleApprove(f.id, f.name)}
                                    className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                                >
                                    <Check size={18} /> 승인
                                </button>
                                <button
                                    onClick={() => handleReject(f.id, f.name)}
                                    className="flex-1 md:flex-none px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-50 flex items-center justify-center gap-2"
                                >
                                    <X size={18} /> 반려
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-2xl w-full bg-white rounded-lg p-2">
                        <img src={selectedImage} alt="License" className="w-full h-auto rounded" />
                        <button className="absolute -top-10 right-0 text-white hover:text-gray-300" onClick={() => setSelectedImage(null)}>
                            <X size={24} /> 닫기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
