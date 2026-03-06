import React, { useState, useEffect } from 'react';
import { MonitorStop, Percent, History } from 'lucide-react';
import { updateSystemSetting } from '../../lib/api/superAdmin';
import { toast } from 'sonner';
import { confirmAsync } from '../../src/components/common/ConfirmModal';
import { useSuperAdminClient } from './SuperAdminGuard';

export const SystemSettings = () => {
    const [commission, setCommission] = useState('3.5');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const client = useSuperAdminClient();

    // DB에서 설정값 로드
    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await client
                    .from('system_settings')
                    .select('key, value')
                    .in('key', ['commission_rate', 'maintenance_mode']);
                if (!data) return;
                for (const row of data) {
                    if (row.key === 'commission_rate' && row.value != null) setCommission(String(row.value));
                    if (row.key === 'maintenance_mode') setMaintenanceMode(row.value === true || row.value === 'true');
                }
            } catch { /* 기본값 유지 */ }
        };
        load();
    }, [client]);

    const handleSaveSystemSettings = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await updateSystemSetting('commission_rate', commission, client);
            toast.success('시스템 설정이 저장되었습니다.');
        } catch {
            toast.error('설정 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
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
                        <input type="checkbox" className="sr-only peer" checked={maintenanceMode} onChange={async (e) => {
                            const checked = e.target.checked;
                            const label = checked ? '활성화' : '비활성화';
                            if (!await confirmAsync(`점검 모드를 ${label}하시겠습니까?\n${checked ? '일반 사용자의 접속이 차단됩니다.' : ''}`)) {
                                return;
                            }
                            try {
                                await updateSystemSetting('maintenance_mode', checked, client);
                                setMaintenanceMode(checked);
                                toast.success(`점검 모드가 ${label} 되었습니다.`);
                            } catch {
                                toast.error('점검 모드 설정 실패');
                            }
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
                                id="commission-rate"
                                name="commission-rate"
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
                        onClick={async () => {
                            if (!await confirmAsync(`수수료율을 ${commission}%로 변경하시겠습니까?`)) return;
                            handleSaveSystemSettings();
                        }}
                        disabled={isSaving}
                        className={`w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSaving ? '저장 중...' : '설정 저장'}
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
                        if (await confirmAsync('데이터베이스를 스캔하여 누락된 매출 기록을 생성하시겠습니까?')) {
                            toast.warning('SQL 패치(fix_revenue_and_billing_date.sql)를 데이터베이스에서 실행해주세요.', { duration: 8000 });
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
