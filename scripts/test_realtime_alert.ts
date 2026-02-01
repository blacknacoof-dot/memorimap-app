// Use dynamic import to ensure env is loaded before supabase client
async function run() {
    const dotenv = await import('dotenv');
    const path = await import('path');
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

    // Force process.env to hold VITE_ variables if they are in .env
    process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

    const { supabase } = await import('../lib/supabaseClient');
    const { AiConsultationStatus } = await import('../types');

    console.log('🚀 실시간 알림 테스트 시작...');

    // 1. 기존 데이터가 있는지 확인
    let { data: latest, error: fetchError } = await supabase
        .from('ai_consultations')
        .select('conversation_id, facility_name')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // 2. 데이터가 없으면 테스트용 가상 데이터 생성
    if (!latest) {
        console.log('💡 기존 데이터가 없어 테스트용 더미 데이터를 생성합니다.');
        const testId = `test_${Date.now()}`;
        const { data: inserted, error: insertError } = await supabase
            .from('ai_consultations')
            .insert({
                conversation_id: testId,
                user_id: null,
                facility_id: '7fd43013-842d-4cbb-94ca-8ca0dc3ac785',
                facility_name: '프리드라이프 (테스트)',
                status: AiConsultationStatus.IDLE,
                category: 'general',
                messages: [{ role: 'user', content: '테스트 상담 시작입니다.' }],
                metadata: {}
            })
            .select()
            .maybeSingle();

        if (insertError) {
            console.error('❌ 더미 데이터 생성 실패:', insertError.message);
            return;
        }
        latest = inserted;
    }

    if (!latest) {
        console.error('❌ 데이터를 생성하거나 가져올 수 없습니다.');
        return;
    }

    console.log(`📝 테스트 대상: ${latest.facility_name} (${latest.conversation_id})`);

    // 3. 해당 건의 상태를 AGENT_REQUESTED로 변경
    const { error: updateError } = await supabase
        .from('ai_consultations')
        .update({
            status: AiConsultationStatus.AGENT_REQUESTED,
            updated_at: new Date().toISOString()
        })
        .eq('conversation_id', latest.conversation_id);

    if (updateError) {
        console.error('❌ 상태 업데이트 실패:', updateError.message);
    } else {
        console.log('✅ AGENT_REQUESTED 상태로 업데이트 완료!');
        console.log('👉 어드민 대시보드(통합 관제)에서 보라색 "AI 인계 요청" 항목과 BellRing 알림을 확인하세요.');
    }
}

run().catch(console.error);
