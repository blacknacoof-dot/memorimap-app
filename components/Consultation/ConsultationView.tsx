import React, { useState, useEffect } from 'react';
import { Facility } from '../../types';
import { Consultation, ConsultationTopic, Message } from '../../types/consultation';
import { ChatBot } from './ChatBot';
import { streamConsultationMessage } from '../../lib/gemini';
import { createConsultation, updateConsultation, getConsultationById, getFacilityFaqs } from '../../lib/queries';
import { getAuthClient } from '../../lib/supabaseClient';
import { useUser, useSession } from '../../lib/auth';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import type { AiConsultCategory, QuotaCheckResult } from '../../types/subscription';
import UpgradePrompt from '../UpgradePrompt';
import { checkAiConsultationQuota } from '../../lib/aiConsultationQuota';

interface Props {
    facility: Facility;
    existingConsultation?: Consultation | null;
    onBack: () => void;
    onOpenHistory: () => void;
    onOpenLogin: () => void;
}

export const ConsultationView: React.FC<Props> = ({
    facility,
    existingConsultation,
    onBack,
    onOpenHistory,
    onOpenLogin
}) => {
    const { user } = useUser();
    const { session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [topic, setTopic] = useState<ConsultationTopic | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [consultationId, setConsultationId] = useState<string | null>(null);
    const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string }>>([]);
    const [quotaExceeded, setQuotaExceeded] = useState<QuotaCheckResult | null>(null);
    const [consultationStatus, setConsultationStatus] = useState<string | null>(null);

    // Initialize from existing consultation if provided
    useEffect(() => {
        // ConsultationView mounted
        if (existingConsultation) {
            setMessages(existingConsultation.messages);
            setTopic(existingConsultation.topic as ConsultationTopic);
            setConsultationId(existingConsultation.id);
            setConsultationStatus(existingConsultation.status ?? 'pending');
        } else {
            // Reset state for new consultation
            setMessages([]);
            setTopic(undefined);
            setConsultationId(null);
            setConsultationStatus(null);
        }
    }, [existingConsultation, facility.id]);

    // Realtime: 관리자 상태 변경 시 유저 측 반영
    useEffect(() => {
        if (!consultationId || !session) return;
        let mounted = true;

        const syncConsultationStatus = async () => {
            try {
                const client = await getAuthClient(session, { strict: true });
                const consultation = await getConsultationById(consultationId, client);
                if (!mounted || !consultation?.status) return;
                setConsultationStatus(consultation.status);
            } catch {
                // Ignore fallback sync failures; realtime remains the primary path.
            }
        };

        const subscribe = async () => {
            const client = await getAuthClient(session, { strict: true });
            if (!mounted) return;
            const channel = client
                .channel(`consultation-user-${consultationId}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'consultations',
                    filter: `id=eq.${consultationId}`,
                }, (payload) => {
                    if (!mounted) return;
                    const newStatus = (payload.new as { status?: string }).status;
                    if (newStatus) {
                        setConsultationStatus(newStatus);
                        const labels: Record<string, string> = {
                            accepted: '시설에서 상담을 접수했습니다.',
                            completed: '상담이 완료되었습니다.',
                            cancelled: '상담이 취소되었습니다.',
                        };
                        if (labels[newStatus]) toast.info(labels[newStatus]);
                    }
                })
                .subscribe();

            await syncConsultationStatus();
            const pollingWindow = window.setInterval(syncConsultationStatus, 5000);

            return () => {
                mounted = false;
                window.clearInterval(pollingWindow);
                client.removeChannel(channel);
            };
        };

        const cleanupPromise = subscribe();
        return () => {
            mounted = false;
            cleanupPromise.then(cleanup => cleanup?.());
        };
    }, [consultationId, session]);

    // Load FAQs
    useEffect(() => {
        const loadFaqs = async () => {
            if (facility.id) {
                const data = await getFacilityFaqs(facility.id.startsWith('db-') ? facility.id.substring(3) : facility.id);
                setFaqs(data);
            }
        };
        loadFaqs();
    }, [facility.id]);

    // facility.type → AiConsultCategory 매핑
    const getAiCategory = (): AiConsultCategory => {
        const t = (facility as { type?: string }).type || '';
        if (t === 'funeral_home' || t === '장례식장') return 'funeral_home';
        if (t === 'pet_funeral' || t === '동물장례') return 'pet_funeral';
        return 'memorial_facility';
    };

    const saveMessage = async (newMessages: Message[]): Promise<boolean> => {
        if (!user) return false;

        if (!consultationId) {
            // 새 상담 생성 전 쿼터 체크 (user + facility 동시)
            const category = getAiCategory();
            const authClient = await getAuthClient(session, { strict: true });

            let result: QuotaCheckResult;
            try {
                result = await checkAiConsultationQuota(authClient, facility.id, category);
            } catch {
                toast.error('AI 상담 이용 한도를 확인하지 못했습니다. 다시 시도해 주세요.');
                return false;
            }

            if (!result.allowed) {
                setQuotaExceeded(result);
                return false;
            }

            // Create new consultation
            const createResult = await createConsultation(
                facility.id,
                user.id,
                user.fullName || user.firstName || '사용자',
                user.primaryPhoneNumber?.phoneNumber || '',
                `[${topic || '일반 상담'}] ${newMessages[newMessages.length - 1]?.text || '상담 시작'}`,
                topic || '?쇰컲 ?곷떞',
                authClient
            );
            if (createResult?.id) {
                setConsultationId(createResult.id);
                return true;
            }
            return false;
        } else {
            // Update existing
            const updateClient = await getAuthClient(session, { strict: true });
            await updateConsultation(consultationId, newMessages, updateClient);
            return true;
        }
    };

    const handleSendMessage = async (text: string) => {
        // Use default topic if not set
        const activeTopic = topic || "일반 상담";

        // Enforce Login
        if (!user) {
            onOpenLogin(); // Trigger Login Modal
            return;
        }

        const userMsg: Message = { role: 'user', text, timestamp: new Date() };
        const updatedMessages = [...messages, userMsg];

        setMessages(updatedMessages);
        setIsLoading(true);
        setStreamingText('');

        try {
            // Optimistic save (only if user exists)
            const canProceed = await saveMessage(updatedMessages);
            if (!canProceed) {
                setMessages(messages);
                return;
            }

            let fullResponse = "";
            const stream = streamConsultationMessage(facility, updatedMessages, text, activeTopic, faqs);

            for await (const chunk of stream) {
                setStreamingText(prev => prev + chunk);
                fullResponse += chunk;
            }

            const modelMsg: Message = { role: 'model', text: fullResponse, timestamp: new Date() };
            const finalMessages = [...updatedMessages, modelMsg];

            setMessages(finalMessages);

            // Save final state with model response
            await saveMessage(finalMessages);

        } catch (_error) {
            // Consultation error occurred
            // Add error message locally
            setMessages(prev => [...prev, {
                role: 'model',
                text: "죄송합니다. 오류가 발생했습니다.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
            setStreamingText('');
        }
    };

    const handleTopicSelect = (selectedTopic: ConsultationTopic) => {
        setTopic(selectedTopic);
        // Auto-start message logic could go here if needed, 
        // but simplistic approach is just setting state.
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="font-bold text-gray-900 leading-tight">{facility.name} AI 상담</h2>
                        {consultationStatus && consultationStatus !== 'pending' ? (
                            <p
                                data-testid="consultation-status-badge"
                                className={`text-xs font-bold ${
                                consultationStatus === 'accepted' ? 'text-blue-600' :
                                consultationStatus === 'completed' ? 'text-emerald-600' :
                                consultationStatus === 'cancelled' ? 'text-red-500' :
                                'text-gray-500'
                            }`}>
                                {consultationStatus === 'accepted' ? '접수됨' :
                                 consultationStatus === 'completed' ? '완료' :
                                 consultationStatus === 'cancelled' ? '취소됨' :
                                 consultationStatus}
                            </p>
                        ) : (
                            <p className="text-xs text-primary font-bold animate-pulse">{topic || "무엇이든 물어보세요"}</p>
                        )}
                    </div>
                </div>
                <button onClick={onOpenHistory} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 overflow-hidden relative">
                <ChatBot
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    streamingText={streamingText}
                    topic={topic}
                    onTopicSelect={handleTopicSelect}
                />
            </div>

            {/* 유저 쿼터 초과 모달 */}
            <UpgradePrompt
                isOpen={!!quotaExceeded && quotaExceeded.reason !== 'facility_limit'}
                onClose={() => setQuotaExceeded(null)}
                featureName={`AI 상담 (${getAiCategory() === 'funeral_home' ? '장례식장' : getAiCategory() === 'pet_funeral' ? '반려동물' : '추모시설 (납골당·수목장·묘지 등)'})`}
                current={quotaExceeded?.current ?? 0}
                limit={quotaExceeded?.limit ?? 0}
            />

            {/* 시설 쿼터 초과 안내 */}
            {quotaExceeded?.reason === 'facility_limit' && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center">
                        <p className="text-lg font-bold text-gray-900 mb-2">지금은 AI 상담이 어렵습니다</p>
                        <p className="text-sm text-gray-600 mb-4">
                            이 시설의 AI 상담 월간 한도가 소진되었습니다.<br />
                            직접 전화 문의를 이용해 주세요.
                        </p>
                        <button
                            onClick={() => setQuotaExceeded(null)}
                            className="w-full py-3 bg-primary text-white rounded-xl font-semibold"
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
