import React from 'react';
import { Heart, Shield, MessageCircle, FileText, CheckCircle } from 'lucide-react';

export interface JourneyStep {
    label: string;
    done: boolean;
    icon: React.ReactNode;
}

interface Props {
    steps: JourneyStep[];
    percent: number;
    userName: string;
}

export default function JourneyProgressGraph({ steps, percent, userName }: Props) {
    return (
        <div className="bg-white rounded-xl p-4 border border-pink-100 shadow-sm">
            {/* 상단 요약 */}
            <div className="flex justify-between items-baseline mb-2">
                <p className="text-xs font-medium text-gray-700">
                    <span className="text-pink-600 font-bold">{userName}</span> 님의 추모 여정이{' '}
                    <span className="text-pink-600 font-bold">{percent}%</span> 준비되었습니다.
                </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mb-4">
                <div
                    className="bg-gradient-to-r from-pink-400 to-purple-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${percent}%` }}
                />
            </div>

            {/* 세로 스테퍼 */}
            <div className="space-y-0">
                {steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                        {/* 아이콘 + 연결선 */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                                    step.done
                                        ? 'bg-gradient-to-br from-pink-400 to-purple-400 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                                }`}
                            >
                                {step.icon}
                            </div>
                            {i < steps.length - 1 && (
                                <div
                                    className={`w-0.5 h-5 transition-colors duration-500 ${
                                        step.done ? 'bg-gradient-to-b from-pink-300 to-purple-300' : 'bg-gray-200'
                                    }`}
                                />
                            )}
                        </div>

                        {/* 라벨 */}
                        <div className="pt-1.5">
                            <span
                                className={`text-xs font-medium transition-colors duration-300 ${
                                    step.done ? 'text-gray-800' : 'text-gray-400'
                                }`}
                            >
                                {step.label}
                                {step.done && (
                                    <span className="ml-1.5 text-[10px] text-pink-500 font-bold">완료</span>
                                )}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* 하단 안내 */}
            {percent >= 100 ? (
                <p className="text-xs text-pink-600 font-bold mt-3 text-center">
                    모든 준비가 완료되었습니다!
                </p>
            ) : (
                <p className="text-xs text-gray-500 mt-3">
                    나머지 <strong>{100 - percent}%</strong>를 위해 AI 상담사에게 장례 절차를 물어보세요.
                </p>
            )}
        </div>
    );
}

/** 여정 단계 계산 헬퍼 */
export function computeJourneySteps(
    facilityFavoriteCount: number,
    sangjoFavoriteCount: number,
    consultationCount: number,
    note: { preferences?: string[]; contact?: string; memo?: string; percent?: number } | null
): { steps: JourneyStep[]; percent: number } {
    const hasPreferences = !!(note?.preferences && note.preferences.length > 0);
    const hasContact = !!(note?.contact && note.contact.trim().length > 0);
    const hasMemo = !!(note?.memo && note.memo.trim().length > 0);
    const noteFieldCount = [hasPreferences, hasContact, hasMemo].filter(Boolean).length;

    const steps: JourneyStep[] = [
        {
            label: '시설 찜하기',
            done: facilityFavoriteCount > 0,
            icon: <Heart size={14} />,
        },
        {
            label: '상조 찜하기',
            done: sangjoFavoriteCount > 0,
            icon: <Shield size={14} />,
        },
        {
            label: '상담 신청',
            done: consultationCount > 0,
            icon: <MessageCircle size={14} />,
        },
        {
            label: '엔딩노트 시작',
            done: noteFieldCount >= 1,
            icon: <FileText size={14} />,
        },
        {
            label: '준비 완료',
            done: noteFieldCount >= 3,
            icon: <CheckCircle size={14} />,
        },
    ];

    const doneCount = steps.filter(s => s.done).length;
    const percent = Math.round((doneCount / steps.length) * 100);

    return { steps, percent };
}
