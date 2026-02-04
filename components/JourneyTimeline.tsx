import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface JourneyLog {
    title: string;
    description: string;
    created_at: string;
}

export default function JourneyTimeline() {
    const [logs, setLogs] = useState<JourneyLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadJourney();
    }, []);

    const loadJourney = async () => {
        // get_my_journey_full RPC 호출 (통합 데이터 조회)
        const { data, error } = await supabase.rpc('get_my_journey_full');

        if (error) {
            console.error('여정 불러오기 실패:', error);
            setLoading(false);
            return;
        }

        setLogs(data?.timeline || []);
        setLoading(false);
    };

    if (loading) {
        return <div className="animate-pulse h-48 bg-gray-100 rounded-lg" />;
    }

    return (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                <h2 className="text-xl font-bold">기순행보 (여정 기록)</h2>
            </div>

            {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p>아직 기록된 여정이 없습니다.</p>
                    <p className="text-sm mt-2">시설을 찜하거나 상담을 시작해보세요.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {logs.map((log, index) => (
                        <div
                            key={index}
                            className="flex gap-4 pb-4 border-b border-gray-50 last:border-0"
                        >
                            {/* 타임라인 점 및 선 */}
                            <div className="flex flex-col items-center">
                                <div className="w-3 h-3 bg-pink-400 rounded-full mt-1.5 shadow-[0_0_0_4px_rgba(244,114,182,0.2)]" />
                                {index !== logs.length - 1 && (
                                    <div className="w-0.5 h-full bg-gray-100 mt-2" />
                                )}
                            </div>

                            {/* 로그 내용 */}
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">{log.title}</p>
                                {log.description && (
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{log.description}</p>
                                )}
                                <time className="text-[11px] text-gray-400 mt-2 block font-medium">
                                    {formatDistanceToNow(new Date(log.created_at), {
                                        addSuffix: true,
                                        locale: ko
                                    })}
                                </time>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
