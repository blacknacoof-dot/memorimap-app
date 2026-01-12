import { useState } from 'react';
import { LayoutDashboard, Calendar, Settings, LogOut, MessageSquare } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useFacilityAdmin } from '@/hooks/useFacilityAdmin';

// 하위 컴포넌트
import ReservationManager from './facility/ReservationManager';
import { FacilityEditForm } from '../forms/FacilityEditForm';
import { ConsultationList } from './ConsultationList';

export default function FacilityDashboard() {
    const { facility, reservations, isLoading, error, updateStatus, updateFacility } = useFacilityAdmin();
    const [activeTab, setActiveTab] = useState<'reservations' | 'consultations' | 'settings'>('consultations');
    const { signOut } = useClerk();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;

    // 시설이 없는 경우 (아직 승인되지 않았거나 등록 안 함)
    if (!facility) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">시설 정보가 없습니다</h2>
                    <p className="text-gray-600 mb-6">
                        아직 관리 권한이 승인되지 않았거나, 등록된 시설이 없습니다.<br />
                        슈퍼 관리자에게 문의하거나 입점 신청을 진행해주세요.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-200 rounded-lg">홈으로</button>
                        <button onClick={() => navigate('/partner-apply')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">입점 신청하기</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* 사이드바 */}
            <aside className="w-64 bg-white border-r hidden md:flex flex-col fixed h-full z-10">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                        <LayoutDashboard className="text-indigo-600" />
                        Partner Center
                    </h1>
                    <p className="text-xs text-gray-500 mt-1 truncate">{facility.name}</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('consultations')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'consultations' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-50 text-gray-600'
                            }`}
                    >
                        <MessageSquare size={20} />
                        상담 접수
                    </button>

                    <button
                        onClick={() => setActiveTab('reservations')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'reservations' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-50 text-gray-600'
                            }`}
                    >
                        <Calendar size={20} />
                        예약 관리
                        {reservations.filter(r => r.status === 'pending').length > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {reservations.filter(r => r.status === 'pending').length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-50 text-gray-600'
                            }`}
                    >
                        <Settings size={20} />
                        시설 정보 수정
                    </button>
                </nav>

                <div className="p-4 border-t">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg">
                        <LogOut size={20} /> 로그아웃
                    </button>
                </div>
            </aside>

            {/* 메인 컨텐츠 */}
            <main className="flex-1 md:ml-64 p-8">
                <div className="max-w-5xl mx-auto">
                    <header className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {activeTab === 'consultations' ? '상담 접수 현황' : activeTab === 'reservations' ? '예약 관리' : '시설 정보 수정'}
                        </h2>
                    </header>

                    {activeTab === 'consultations' ? (
                        <ConsultationList facilityId={facility.id.toString()} />
                    ) : activeTab === 'reservations' ? (
                        <ReservationManager
                            reservations={reservations}
                            onUpdateStatus={updateStatus}
                        />
                    ) : (
                        <FacilityEditForm
                            initialData={facility}
                            onSubmit={async (data) => {
                                await updateFacility({
                                    name: data.name,
                                    address: data.address,
                                    type: data.type,
                                    ai_context: data.ai_context,
                                    ai_features: data.ai_features,
                                    is_verified: true
                                });
                            }}
                            onCancel={() => setActiveTab('reservations')}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
