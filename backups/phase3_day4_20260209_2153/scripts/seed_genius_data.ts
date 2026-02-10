import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Use service role for seeding

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables! Check .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const seedGenius = async () => {
    console.log('🚀 Starting Genius Seeding (Bypassing RLS with Service Role)...');

    // 1. Create Sample Partners with Legacy IDs (from constants.ts)
    const partners = [
        {
            id: 'fc_new_1', // 프리드라이프
            name: '프리드라이프 (Genius)',
            company_name: '(주)프리드라이프',
            status: 'approved',
            subscription_plan: 'enterprise',
            funeral_location: '서울 강남구 테헤란로 123',
            ai_context: {
                welcome_message: '안녕하세요. 프리드라이프 AI 상담사입니다. 유가족분들의 마음을 다해 정성스럽게 안내해 드리겠습니다.',
                tone: 'polite',
                prices: '프리미엄 상조: 450만원\n표준형 상조: 390만원',
                emphasis: ['국내 1위 상조 기업', '24시간 긴급 출동 시스템'],
                benefits: ['추모맵 전용 30만원 추가 할인']
            }
        },
        {
            id: 'fc_new_4', // 더케이예다함
            name: '예다함상조 (Genius)',
            company_name: '더케이예다함상조(주)',
            status: 'approved',
            subscription_plan: 'pro',
            funeral_location: '서울 마포구 독막로 456',
            ai_context: {
                welcome_message: '믿음과 정성의 예다함상조입니다. 원하시는 장례 절차에 대해 문의해 주세요.',
                tone: 'warm',
                prices: '실속형: 290만원\n표준형: 380만원',
                emphasis: ['한국교직원공제회 100% 출자', '미사용 품목 100% 환불'],
                benefits: ['추모맵 가입 특전 제공']
            }
        }
    ];

    const { data: insertedPartners, error: pError } = await supabase.from('partners').insert(partners).select();
    if (pError) {
        console.error('Partner Seed Error:', pError);
        return;
    }
    console.log('✅ Partners Seeded:', insertedPartners.length);

    const sjId = insertedPartners[0].id; // Sejong
    const maId = insertedPartners[1].id; // Maum

    // 2. Create Sample Conversations (Live Monitoring)
    const convs = [
        {
            partner_id: sjId,
            user_name: '홍길동 고객님',
            user_phone: '010-1234-5678',
            conversation_status: 'agent_requested',
            priority: 'high',
            messages: [
                { role: 'assistant', content: '안녕하세요. 세종상조 AI 상담사입니다. 무엇을 도와드릴까요?', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
                { role: 'user', content: '장례 비용 견적이 궁금합니다.', timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString() },
                { role: 'assistant', content: '세종상조의 3일 표준장은 390만원입니다. 상세한 내역을 상담사와 확인하시겠습니까?', timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
                { role: 'user', content: '네, 상담사 연결 부탁드려요.', timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString() }
            ],
            last_message_at: new Date().toISOString()
        },
        {
            partner_id: maId,
            user_name: '이순신 고객님',
            user_phone: '010-9999-8888',
            conversation_status: 'ai_handling',
            priority: 'normal',
            messages: [
                { role: 'assistant', content: '안녕하세요. 마음상조입니다. 현재 위치하신 장례식장을 알려주시면 안내를 도와드리겠습니다.', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
                { role: 'user', content: '분당서울대병원 장례식장에 위치하고 있습니다.', timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString() }
            ],
            last_message_at: new Date().toISOString()
        }
    ];

    const { error: cError } = await supabase.from('partner_conversations').insert(convs);
    if (cError) console.error('Conversation Seed Error:', cError);
    else console.log('✅ Conversations Seeded');

    // 3. Create Sample Operations (Kanban)
    const ops = [
        {
            partner_id: sjId,
            operation_stage: 'dispatched',
            deceased_name: '故 나장례님',
            funeral_director: '김철수 팀장',
            funeral_location: '서울의료원 장례식장',
            estimated_cost: 3900000,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        },
        {
            partner_id: sjId,
            operation_stage: 'pending',
            deceased_name: '故 이상조님',
            funeral_location: '신촌세브란스 장례식장',
            estimated_cost: 4500000,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString()
        }
    ];

    const { error: oError } = await supabase.from('partner_operations').insert(ops);
    if (oError) console.error('Operation Seed Error:', oError);
    else console.log('✅ Operations Seeded');

    // 4. Create Platform Notice
    const notices = [
        {
            title: '추모맵 파트너 시스템 고도화 안내',
            content: '안녕하세요. 추모맵입니다. 파트너분들을 위한 실시간 관제 및 AI 시나리오 기능이 업데이트되었습니다. 설정 메뉴에서 확인해 주세요.',
            notice_type: 'urgent',
            is_active: true
        }
    ];

    const { error: nError } = await supabase.from('platform_notices').insert(notices);
    if (nError) console.error('Notice Seed Error:', nError);
    else console.log('✅ Notices Seeded');

    console.log('🎉 Seeding Completed Successfully!');
};

seedGenius().catch(err => {
    console.error('❌ Fatal Seed Error:', err);
    process.exit(1);
});
