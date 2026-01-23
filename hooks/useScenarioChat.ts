import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface ScenarioOption {
    label: string;
    next: string;
    action?: string; // 'CALL_VAN', 'RESERVE_VISIT', 'CALL_MANAGER', etc.
}

export interface ScenarioNode {
    message: string;
    options?: ScenarioOption[];
}

export interface ScenarioData {
    start_node: string;
    nodes: Record<string, ScenarioNode>;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    options?: ScenarioOption[];
    timestamp?: Date;
}

export const useScenarioChat = (facilityId: string, onAction?: (action: string, data?: any) => void) => {
    const [scenario, setScenario] = useState<ScenarioData | null>(null);
    const [currentNodeId, setCurrentNodeId] = useState<string>('');
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Load Scenario
    useEffect(() => {
        if (!facilityId) return;

        const fetchScenario = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('facility_scenarios')
                    .select('scenario_data')
                    .eq('facility_id', facilityId)
                    .single();

                if (error) {
                    // console.warn('No scenario found for this facility, using default.', error);
                    // Fallback to a default scenario if none exists
                    setScenario(DEFAULT_SCENARIO);
                    setCurrentNodeId('start_node');
                    // Initialize chat with start message
                    const startNodeId = DEFAULT_SCENARIO.start_node || 'welcome';
                    const startNode = DEFAULT_SCENARIO.nodes[startNodeId] || DEFAULT_SCENARIO.nodes['welcome'];
                    setHistory([{
                        role: 'assistant',
                        content: startNode.message,
                        options: startNode.options,
                        timestamp: new Date()
                    }]);
                } else if (data) {
                    const loadedScenario = data.scenario_data as ScenarioData;
                    setScenario(loadedScenario);
                    // Check if start_node exists
                    const startId = loadedScenario.start_node || 'start_node';
                    setCurrentNodeId(startId);

                    if (loadedScenario.nodes[startId]) {
                        setHistory([{
                            role: 'assistant',
                            content: loadedScenario.nodes[startId].message,
                            options: loadedScenario.nodes[startId].options,
                            timestamp: new Date()
                        }]);
                    }
                }
            } catch (err: any) {
                console.error("Scenario fetch error, falling back:", err);
                // Fallback on error (e.g. table missing)
                setScenario(DEFAULT_SCENARIO);
                const startNodeId = DEFAULT_SCENARIO.start_node || 'welcome';
                setCurrentNodeId(startNodeId);
                const startNode = DEFAULT_SCENARIO.nodes[startNodeId] || DEFAULT_SCENARIO.nodes['welcome'];

                if (startNode) {
                    setHistory([{
                        role: 'assistant',
                        content: startNode.message,
                        options: startNode.options,
                        timestamp: new Date()
                    }]);
                } else {
                    console.error("Critical: Default Scenario Start Node not found");
                    setError("System Error: Default Scenario Missing");
                }
                // setError(err.message); // Don't expose internal error to UI if fallback works, but here fallback might have failed? 
                // actually let's keep error suppress if fallback works
            } finally {
                setIsLoading(false);
            }
        };

        fetchScenario();
    }, [facilityId]);

    // 2. Handle User Selection
    const handleOptionClick = async (option: ScenarioOption) => {
        if (!scenario) return;

        // Add User Selection to History
        const userMsg: ChatMessage = {
            role: 'user',
            content: option.label,
            timestamp: new Date()
        };

        // Find Next Node
        const nextNodeId = option.next;
        const nextNode = scenario.nodes[nextNodeId];

        // Prepare Bot Response
        let botMsg: ChatMessage | null = null;
        if (nextNode) {
            botMsg = {
                role: 'assistant',
                content: nextNode.message,
                options: nextNode.options,
                timestamp: new Date()
            };
        } else {
            // End of conversation or invalid node
            botMsg = {
                role: 'assistant',
                content: "대화가 종료되었습니다. 추가 문의는 전화로 부탁드립니다.",
                timestamp: new Date()
            };
        }

        setHistory(prev => botMsg ? [...prev, userMsg, botMsg] : [...prev, userMsg]);
        setCurrentNodeId(nextNodeId);

        // 3. Handle Special Actions (Delegate to Parent)
        if (option.action && onAction) {
            onAction(option.action, { facilityId, option });
        }
    };

    const resetChat = () => {
        if (scenario) {
            const startId = scenario.start_node || 'start_node';
            setCurrentNodeId(startId);
            if (scenario.nodes[startId]) {
                setHistory([{
                    role: 'assistant',
                    content: scenario.nodes[startId].message,
                    options: scenario.nodes[startId].options,
                    timestamp: new Date()
                }]);
            }
        } else {
            setHistory([]);
        }
    };

    return {
        history,
        handleOptionClick,
        isLoaded: !isLoading,
        scenario,
        resetChat,
        error
    };
};

// Default Scenario (Maum-i Concierge Style)
const DEFAULT_SCENARIO: ScenarioData = {
    "start_node": "welcome",
    "nodes": {
        "welcome": {
            "message": "안녕하세요. **통합 AI 마음이**입니다.\n무엇을 도와드릴까요?",
            "options": [
                { "label": "🏢 장례식장 찾기", "next": "find_funeral", "action": "SHOW_FORM_A" },
                { "label": "🌲 추모시설 찾기", "next": "find_memorial", "action": "SHOW_FORM_B" },
                { "label": "🐶 동물장례", "next": "pet_funeral", "action": "Mode_Pet" },
                { "label": "💬 기타/상담", "next": "consult_chat", "action": "OPEN_CONSULT_FORM" }
            ]
        },
        "find_funeral": {
            "message": "장례식장을 찾으시나요? 위치나 비용 등 원하시는 조건을 알려주세요.",
            "options": [
                { "label": "조건 입력하기", "next": "welcome", "action": "SHOW_FORM_A" }
            ]
        },
        "find_memorial": {
            "message": "납골당이나 수목장 같은 추모시설을 찾아드릴까요?",
            "options": [
                { "label": "조건 입력하기", "next": "welcome", "action": "SHOW_FORM_B" }
            ]
        },
        "pet_funeral": {
            "message": "반려동물 장례식장을 찾고 계신가요?",
            "options": [
                { "label": "가까운 곳 찾기", "next": "welcome", "action": "RECOMMEND_PET" }
            ]
        },
        "consult_chat": {
            "message": "상담원과 직접 이야기 나누고 싶으신가요?",
            "options": [
                { "label": "상담 신청하기", "next": "welcome", "action": "OPEN_CONSULT_FORM" }
            ]
        },
        // Legacy/Urgent nodes
        "urgent": {
            "message": "삼가 조의를 표합니다. 24시간 긴급 이송(엠뷸런스)이 필요하신가요?",
            "options": [
                { "label": "네, 엠뷸런스 보내주세요", "action": "CALL_VAN", "next": "end_urgent_confirmed" },
                { "label": "아니요, 빈소 현황만 궁금합니다", "next": "consult_form" }
            ]
        },
        "end_urgent_confirmed": {
            "message": "확인되었습니다. 10분 내로 담당자가 연락드려 차량을 배차해 드리겠습니다.\n잠시만 대기해 주세요.",
            "options": [] // End
        },
        "consult_form": {
            "message": "상세 상담을 원하시면 아래 버튼을 눌러주세요.",
            "options": [
                { "label": "상담 신청하기", "action": "OPEN_CONSULT_FORM", "next": "welcome" }
            ]
        }
    }
};
