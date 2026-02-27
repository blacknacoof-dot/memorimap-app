import React, { useState, useEffect } from 'react';
import { Facility } from '../../types';
import { Consultation, ConsultationTopic, Message } from '../../types/consultation';
import { ChatBot } from './ChatBot';
import { streamConsultationMessage } from '../../lib/gemini';
import { createConsultation, updateConsultation, getFacilityFaqs } from '../../lib/queries';
import { getAuthClient } from '../../lib/supabaseClient';
import { useUser, useSession } from '../../lib/auth';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useQuotaGate } from '../../hooks/useQuotaGate';
import type { AiConsultCategory } from '../../types/subscription';
import UpgradePrompt from '../UpgradePrompt';

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
    const { checkQuota } = useQuotaGate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [topic, setTopic] = useState<ConsultationTopic | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [consultationId, setConsultationId] = useState<string | null>(null);
    const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string }>>([]);
    const [quotaExceeded, setQuotaExceeded] = useState<{ current: number; limit: number } | null>(null);

    // Initialize from existing consultation if provided
    useEffect(() => {
        // ConsultationView mounted
        if (existingConsultation) {
            setMessages(existingConsultation.messages);
            setTopic(existingConsultation.topic as ConsultationTopic);
            setConsultationId(existingConsultation.id);
        } else {
            // Reset state for new consultation
            setMessages([]);
            setTopic(undefined);
            setConsultationId(null);
        }
    }, [existingConsultation, facility.id]);

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

    const saveMessage = async (newMessages: Message[]) => {
        if (!user) return;

        if (!consultationId) {
            // 새 상담 생성 전 쿼터 체크
            const category = getAiCategory();
            const result = await checkQuota('ai_consult', category);
            if (!result.allowed) {
                setQuotaExceeded({ current: result.current, limit: result.limit });
                return;
            }

            // Create new consultation
            const authClient = await getAuthClient(session, { strict: true });
            const createResult = await createConsultation(
                facility.id,
                user.id,
                user.fullName || user.firstName || '사용자',
                user.primaryPhoneNumber?.phoneNumber || '',
                `[${topic || '일반 상담'}] ${newMessages[newMessages.length - 1]?.text || '상담 시작'}`,
                authClient
            );
            if (createResult?.id) setConsultationId(createResult.id);
        } else {
            // Update existing
            const updateClient = await getAuthClient(session, { strict: true });
            await updateConsultation(consultationId, newMessages, updateClient);
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
            await saveMessage(updatedMessages);

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

        } catch (error) {
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
                        <p className="text-xs text-primary font-bold animate-pulse">{topic || "무엇이든 물어보세요"}</p>
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

            {/* 쿼터 초과 모달 */}
            <UpgradePrompt
                isOpen={!!quotaExceeded}
                onClose={() => setQuotaExceeded(null)}
                featureName={`AI 상담 (${getAiCategory() === 'funeral_home' ? '장례식장' : getAiCategory() === 'pet_funeral' ? '반려동물' : '추모시설'})`}
                current={quotaExceeded?.current ?? 0}
                limit={quotaExceeded?.limit ?? 0}
            />
        </div>
    );
};
