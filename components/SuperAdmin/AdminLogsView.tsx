import React, { useEffect, useState } from 'react';
import { fetchAuditLogs, AuditLog } from '../../lib/api/superAdmin';
import { History, User, ExternalLink, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useSuperAdminClient } from './SuperAdminGuard';

export const AdminLogsView: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const client = useSuperAdminClient();

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await fetchAuditLogs(client);
            setLogs(data);
        } catch {
            toast.error('활동 로그 로딩 실패');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [client]);

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'APPROVE_PARTNER': return '입점 승인';
            case 'REJECT_PARTNER': return '입점 반려';
            case 'UPDATE_ROLE': return '권한 변경';
            default: return action;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <History className="text-blue-600" size={20} />
                    관리 시스템 로그
                </h3>
                <button
                    onClick={loadLogs}
                    className="text-xs text-blue-600 hover:underline min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                    새로고침
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-gray-500">로그 불러오는 중...</div>
                ) : logs.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">기록된 활동 내용이 없습니다.</div>
                ) : (
                    <div className="divide-y divide-gray-100 max-h-[60vh] md:max-h-[600px] overflow-y-auto">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.action.includes('APPROVE') ? 'bg-green-100 text-green-700' :
                                                log.action.includes('REJECT') ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {getActionLabel(log.action)}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {log.metadata?.reason ? `반려 사유: ${log.metadata.reason}` :
                                                log.metadata?.facility_id ? `시설 생성됨 (ID: ${String(log.metadata.facility_id).slice(0, 8)}...)` :
                                                    ''}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <Clock size={10} />
                                        {new Date(log.created_at).toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <User size={12} className="text-gray-400" />
                                        <span className="text-gray-700">{log.user_id || '시스템'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ExternalLink size={12} className="text-gray-400" />
                                        <span>Target: {log.resource_type} ({log.resource_id?.slice(0, 8) || 'N/A'})</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <p className="text-[10px] text-gray-400">* 최근 100개의 시스템 활동 내역만 표시됩니다.</p>
        </div>
    );
};
