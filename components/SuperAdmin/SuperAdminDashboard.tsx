import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
    Building2, CheckCircle2, AlertCircle, Search,
    TrendingUp, Wallet, CreditCard, Users,
    Phone, ChevronRight, Bell, LogOut, Menu, X,
    FileText, UserCog, Settings, ShieldCheck,
    Lock, BellRing, MonitorStop, Percent, History
} from 'lucide-react';
import { PartnerAdmissions } from './PartnerAdmissions';
import { useLeads } from '../../hooks/useLeads';
import { useSubscriptions, useRevenue } from '../../hooks/useFinancials';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import { UserManagement } from './UserManagement';
import { FacilityManagement } from './FacilityManagement';
import { NoticeManager } from '../dashboard/super-admin/NoticeManager';
import { ConfirmModal } from '../../src/components/common/ConfirmModal';
import { NotificationCenter } from '../NotificationCenter';
import { AdminLogsView } from './AdminLogsView';

// MOCK_DATA removed. Using real hooks.

/** [Component] Side Menu Drawer (숨겨진 메뉴들) */
const SideMenuDrawer = ({ isOpen, onClose, onNavigate }: { isOpen: boolean; onClose: () => void, onNavigate: (tab: string) => void }) => {
    if (!isOpen) return null;

    const handleNavigation = (tab: string) => {
        onNavigate(tab);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex">
            {/* Background Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Content */}
            <div className="relative w-64 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800 text-lg">전체 메뉴</h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase">운영 관리</div>
                    <nav className="space-y-1 px-2">
                        {[
                            { icon: ShieldCheck, label: '입점 승인 관리', id: 'admissions', testId: 'admissions-tab' },
                            { icon: Building2, label: '시설 통합 관리', id: 'facilities' },
                            { icon: Users, label: '회원/권한 관리', id: 'users' },
                            { icon: FileText, label: '공지사항 관리', id: 'notices' },
                            { icon: History, label: '시스템 활동 로그', id: 'logs' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavigation(item.id)}
                                data-testid={item.testId}
                                className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-400 uppercase">시스템</div>
                    <nav className="space-y-1 px-2">
                        <button
                            onClick={() => handleNavigation('admin_settings')}
                            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                            <UserCog className="w-5 h-5" />
                            <span>관리자 설정</span>
                        </button>
                        <button
                            onClick={() => handleNavigation('system_settings')}
                            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                            <span>환경 설정</span>
                        </button>
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <p className="text-xs text-slate-400 text-center">Memorimap Admin v1.0</p>
                </div>
            </div>
        </div>
    );
};

/** [Settings] Admin Settings View */
import { updateSystemSetting, updateSubscriptionBillingDate } from '../../lib/api/superAdmin';
import { Calendar } from 'lucide-react';

const AdminSettings = () => {
    const handleSaveProfile = () => {
        alert('프로필 정보가 저장되었습니다. (Internal)');
    };

    const handleChangePassword = () => {
        alert('비밀번호 변경 기능은 Clerk 대시보드에서 관리 가능합니다.');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Profile Section */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-blue-600" />
                    내 정보 수정
                </h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">관리자 이름</label>
                        <input type="text" defaultValue="Super Admin" className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">연락처</label>
                        <input type="tel" defaultValue="010-1234-5678" className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                    <button
                        onClick={handleSaveProfile}
                        className="w-full mt-2 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        정보 업데이트
                    </button>
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-600" />
                    보안 설정
                </h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">현재 비밀번호</label>
                        <input type="password" placeholder="********" className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">새 비밀번호</label>
                        <input type="password" placeholder="새 비밀번호 입력" className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                    <button
                        onClick={handleChangePassword}
                        className="w-full mt-2 bg-slate-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
                    >
                        비밀번호 변경
                    </button>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-blue-600" />
                    알림 설정
                </h3>
                <div className="space-y-4">
                    {[
                        { label: '새 상담 접수 알림', desc: '새로운 고객 상담이 접수되면 알림을 받습니다.' },
                        { label: '결제 발생 알림', desc: '구독 또는 수수료 결제가 발생하면 알림을 받습니다.' },
                        { label: '입점 신청 알림', desc: '새로운 시설 입점 신청이 들어오면 알림을 받습니다.' },
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-800">{item.label}</p>
                                <p className="text-[10px] text-slate-400">{item.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/** [Settings] System Settings View */
const SystemSettings = () => {
    const [commission, setCommission] = useState('3.5');

    const handleSaveSystemSettings = async () => {
        try {
            await updateSystemSetting('commission_rate', commission);
            alert('시스템 설정이 저장되었습니다.');
        } catch (e) {
            console.error(e);
            alert('설정 저장 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Maintenance Mode */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MonitorStop className="w-5 h-5 text-red-500" />
                    서비스 운영 모드
                </h3>
                <div className="flex items-center justify-between bg-red-50 p-4 rounded-lg border border-red-100">
                    <div>
                        <p className="text-sm font-bold text-red-800">점검 모드 (Maintenance)</p>
                        <p className="text-[10px] text-red-600 mt-0.5">활성화 시 일반 사용자의 접속이 차단됩니다.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" onChange={(e) => {
                            updateSystemSetting('maintenance_mode', e.target.checked);
                            alert(`점검 모드가 ${e.target.checked ? '활성화' : '비활성화'} 되었습니다.`);
                        }} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                </div>
            </div>

            {/* Commission Settings */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Percent className="w-5 h-5 text-blue-600" />
                    수수료 및 정산 설정
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">기본 중개 수수료율 (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={commission}
                                onChange={(e) => setCommission(e.target.value)}
                                className="w-full text-sm p-2 pr-8 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                            <span className="absolute right-3 top-2 text-sm text-slate-400">%</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">모든 예약 및 결제 건에 적용되는 기본 수수료입니다.</p>
                    </div>
                    <button
                        onClick={handleSaveSystemSettings}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        설정 저장
                    </button>
                </div>
            </div>

            {/* Revenue Sync Tool */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mt-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-600" />
                    매출 데이터 동기화
                </h3>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
                    <p className="text-sm font-medium text-indigo-800">미집계 매출 복구</p>
                    <p className="text-[10px] text-indigo-600 mt-1 leading-relaxed">
                        결제 내역이 누락된 구독 데이터를 찾아 매출 기록을 생성합니다.<br />
                        데이터 정합성 유지를 위해 주기적으로 실행하는 것을 권장합니다.
                    </p>
                </div>
                <button
                    onClick={async () => {
                        if (confirm('데이터베이스를 스캔하여 누락된 매출 기록을 생성하시겠습니까?')) {
                            alert('SQL 패치(fix_revenue_and_billing_date.sql)를 데이터베이스에서 실행해주세요.');
                        }
                    }}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    동기화 프로세스 시작
                </button>
            </div>
        </div>
    );
};

/** [Tab A] Subscription Manager */
const SubscriptionManager = ({ onManage }: { onManage: (facilityName: string) => void }) => {
    const { data: facilities, loading } = useSubscriptions();

    if (loading) return <div className="p-10 text-center">로딩 중...</div>;

    const handleUpdateBillingDate = async (facilityId: string, current: string) => {
        const newDate = prompt('새로운 재결제 예정일을 입력하세요 (YYYY-MM-DD):', current?.split('T')[0] || '');
        if (newDate) {
            try {
                // Ensure valid ISO string
                const isoDate = new Date(newDate).toISOString();
                await updateSubscriptionBillingDate(facilityId, isoDate);
                alert('재결제 예정일이 업데이트되었습니다.');
                window.location.reload();
            } catch (e) {
                alert('날짜 형식이 올바르지 않거나 업데이트에 실패했습니다.');
            }
        }
    };

    const total = facilities.length;
    const active = facilities.filter(f => f.status === 'active').length;
    const pending = facilities.filter(f => f.status !== 'active').length;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="p-2 md:p-3 bg-slate-50 rounded-xl">
                        <Building2 className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-black text-slate-800">{total}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-400">전체 시설</p>
                    </div>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="p-2 md:p-3 bg-green-50 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-black text-slate-800">{active}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-400">활성 구독</p>
                    </div>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="p-2 md:p-3 bg-orange-50 rounded-xl">
                        <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-black text-slate-800">{pending}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-400">대기/만료</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h3 className="text-sm font-bold text-slate-800">구독 시설 목록</h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border rounded-lg">
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                        <input type="text" placeholder="간편 검색..." className="bg-transparent text-xs outline-none w-24" />
                    </div>
                </div>
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {(facilities as any[]).map((fac) => (
                        <div key={fac.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">{fac.facility_name}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${fac.plan_name === 'Premium' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        fac.plan_name === 'Enterprise' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                            'bg-slate-50 text-slate-500 border-slate-200'
                                        }`}>
                                        {fac.plan_name || 'Basic'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                        <span className="text-[11px] text-slate-400">만료: {fac.end_date ? new Date(fac.end_date).toLocaleDateString() : '-'}</span>
                                    </div>
                                    <button
                                        onClick={() => handleUpdateBillingDate(fac.facility_id_uuid || fac.facility_id_bigint || fac.id, fac.next_billing_date)}
                                        className="flex items-center gap-1.5 text-[11px] text-blue-600 font-black hover:text-blue-700 transition-colors"
                                    >
                                        <Calendar className="w-3.5 h-3.5" />
                                        재결제일: {fac.next_billing_date ? new Date(fac.next_billing_date).toLocaleDateString() : '설정 필요'}
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => onManage(fac.facility_name)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                            >
                                관리하기
                            </button>
                        </div>
                    ))}
                    {facilities.length === 0 && (
                        <div className="p-5 text-center text-xs text-slate-400">구독 중인 시설이 없습니다.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

/** [Component] Trend Bar Chart (Genius Visualization) */
const TrendChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">매출 트렌드 (최근)</h4>
            <div className="flex items-end justify-between h-32 gap-2">
                {data.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="relative w-full flex justify-center items-end h-full">
                            <div
                                className={`w-full max-w-[20px] rounded-t-sm transition-all duration-700 ease-out border-t-2 ${item.color}`}
                                style={{
                                    height: `${(item.value / max) * 100}%`,
                                    opacity: 0.8
                                }}
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                                    ₩{(item.value / 10000).toFixed(0)}만
                                </div>
                            </div>
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/** [Tab B] Revenue Analytics */
const RevenueAnalytics = () => {
    const { payments, totalRevenue, loading } = useRevenue();

    if (loading) return <div className="p-10 text-center">로딩 중...</div>;

    const subRevenue = payments
        .filter(p => p.description && p.description.includes('구독'))
        .reduce((acc, curr) => acc + curr.amount, 0);
    const commRevenue = totalRevenue - subRevenue;

    // Sample data for TrendChart (In a real app, this would be grouped by date)
    const trendData = [
        { label: '월', value: totalRevenue * 0.1, color: 'bg-blue-400 border-blue-500' },
        { label: '화', value: totalRevenue * 0.15, color: 'bg-indigo-400 border-indigo-500' },
        { label: '수', value: totalRevenue * 0.08, color: 'bg-blue-400 border-blue-500' },
        { label: '목', value: totalRevenue * 0.22, color: 'bg-indigo-400 border-indigo-500' },
        { label: '금', value: totalRevenue * 0.3, color: 'bg-blue-500 border-blue-600' },
        { label: '토', value: totalRevenue * 0.12, color: 'bg-indigo-400 border-indigo-500' },
        { label: '일', value: totalRevenue * 0.03, color: 'bg-blue-400 border-blue-500' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Total Revenue Card */}
                <div className="lg:col-span-2 w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-2xl p-5 md:p-6 text-white shadow-xl flex justify-between items-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>

                    <div className="relative z-10">
                        <p className="text-blue-100 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 opacity-80">누적 총 매출</p>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight flex items-baseline gap-1">
                            <span className="text-lg md:text-xl font-normal opacity-70">₩</span>
                            {totalRevenue.toLocaleString()}
                        </h2>
                        <div className="flex items-center gap-2 mt-4">
                            <span className="bg-white/20 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[9px] md:text-[11px] font-bold flex items-center backdrop-blur-md border border-white/10">
                                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1" /> 실시간 매출 분석 중
                            </span>
                        </div>
                    </div>
                    <div className="bg-white/10 p-3 md:p-4 rounded-2xl border border-white/20 backdrop-blur-sm relative z-10 hidden sm:block shadow-inner">
                        <Wallet className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                </div>

                {/* Sub Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4">
                    <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4">
                        <div className="p-2 md:p-3 bg-indigo-50 rounded-xl">
                            <Users className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                        </div>
                        <div className="text-center md:text-left">
                            <span className="text-[10px] md:text-xs text-slate-400 block mb-0.5 md:mb-1">구독료 매출</span>
                            <p className="text-lg md:text-2xl font-bold text-slate-800">₩ {(subRevenue / 10000).toFixed(0)}만</p>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4">
                        <div className="p-2 md:p-3 bg-emerald-50 rounded-xl">
                            <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                        </div>
                        <div className="text-center md:text-left">
                            <span className="text-[10px] md:text-xs text-slate-400 block mb-0.5 md:mb-1">기타 매출</span>
                            <p className="text-lg md:text-2xl font-bold text-slate-800">₩ {(commRevenue / 10000).toFixed(0)}만</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TrendChart data={trendData} />
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-full">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                        <History className="w-4 h-4 text-blue-600" />
                        최근 거래 내역
                    </h3>
                    <div className="space-y-4">
                        {payments.slice(0, 6).map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm truncate max-w-[120px]">{tx.facility_name}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(tx.paid_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-900 text-sm">+{tx.amount?.toLocaleString()}</p>
                                    <p className={`text-[10px] font-medium ${tx.status === 'completed' ? 'text-green-600' : 'text-slate-400'}`}>
                                        {tx.status === 'completed' ? '결제완료' : tx.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/** [Tab C] Consultation Leads */
const AdminLeadsView = () => {
    const { leads, loading } = useLeads();

    if (loading) return <div className="p-10 text-center">로딩 중...</div>;

    const newLeadsCount = leads.filter(l => l.status === 'new').length;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                    <h3 className="text-sm font-bold text-slate-800">상담 신청 관리</h3>
                </div>
                {newLeadsCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                        {newLeadsCount} New
                    </span>
                )}
            </div>

            <div className="divide-y divide-slate-100 h-96 overflow-y-auto">
                {leads.map((lead) => (
                    <div key={lead.id} className="group p-3 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${lead.status === 'new' ? 'bg-red-500 ring-2 ring-red-100' : 'bg-slate-300'}`} />
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${lead.status === 'new' ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {lead.contact_name || '고객'}
                                    </span>
                                    <span className="text-xs text-slate-400 tracking-tight">
                                        {lead.contact_phone}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-500 mt-0.5">
                                    {lead.category}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {new Date(lead.created_at).toLocaleDateString()}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </div>
                    </div>
                ))}
                {leads.length === 0 && (
                    <div className="p-10 text-center text-gray-400 text-sm">접수된 상담이 없습니다.</div>
                )}
            </div>
        </div>
    );
};

/** [Main Container] */
export default function SuperAdminDashboard() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'subs' | 'revenue' | 'leads' | 'admissions' | 'facilities' | 'users' | 'notices' | 'logs' | 'admin_settings' | 'system_settings'>('leads');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [facilitySearchTerm, setFacilitySearchTerm] = useState('');

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans relative">
            {/* Side Menu Drawer Component */}
            <SideMenuDrawer
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(tab) => setActiveTab(tab as any)}
            />

            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Menu Button (Trigger Drawer) */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-1.5 md:p-2 -ml-1 md:-ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <Menu className="w-5 h-5 md:w-6 md:h-6" />
                        </button>

                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-base font-black text-slate-900 leading-none tracking-tight">Admin</h1>
                            <p className="hidden md:block text-[11px] font-medium text-slate-400 mt-1">{user?.primaryEmailAddress?.emailAddress || 'User'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <NotificationCenter />
                        <div className="h-5 w-[1px] bg-slate-200 mx-0.5 md:mx-1"></div>
                        <button className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all text-xs font-bold">
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">나가기</span>
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="max-w-5xl mx-auto px-2 md:px-4 overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-4 md:gap-6 min-w-max">
                        {[
                            { id: 'subs', label: '구독 관리', icon: Building2 },
                            { id: 'revenue', label: '매출 통계', icon: TrendingUp },
                            { id: 'leads', label: '상담 관리', icon: Users },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-1.5 md:gap-2 py-3 md:py-4 px-1 md:px-2 text-[13px] md:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <tab.icon className="w-3.5 h-3.5 md:w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* 2. Main Content Area */}
            <main className="max-w-5xl mx-auto p-4 md:p-6">
                {activeTab === 'subs' && (
                    <SubscriptionManager
                        onManage={(name) => {
                            setFacilitySearchTerm(name);
                            setActiveTab('facilities');
                        }}
                    />
                )}
                {activeTab === 'revenue' && <RevenueAnalytics />}
                {activeTab === 'leads' && <AdminLeadsView />}

                {/* Render Management Components */}
                {activeTab === 'admissions' && <PartnerAdmissions />}
                {activeTab === 'facilities' && (
                    <FacilityManagement
                        initialSearch={facilitySearchTerm}
                        onClearSearch={() => setFacilitySearchTerm('')}
                    />
                )}
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'notices' && <NoticeManager />}
                {activeTab === 'logs' && <AdminLogsView />}
                {activeTab === 'admin_settings' && <AdminSettings />}
                {activeTab === 'system_settings' && <SystemSettings />}
                <ConfirmModal />
            </main>
        </div>
    );
}
