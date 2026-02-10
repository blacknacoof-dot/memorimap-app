import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFacility() {
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, lat, lng')
        .ilike('name', '%금강%');

    if (error) {
        console.error('오류:', error.message);
        return;
    }

    console.log('=== 금강장례식장 정보 ===\n');
    for (const f of data || []) {
        console.log(`이름: ${f.name}`);
        console.log(`주소: ${f.address}`);
        console.log(`좌표: (${f.lat}, ${f.lng})`);

        // 좌표 분석
        if (f.lat >= 36.3 && f.lat <= 36.6 && f.lng >= 127.6 && f.lng <= 128.0) {
            console.log('⚠️ 좌표가 충북 보은 근처입니다!');
        }
        if (f.address?.includes('인천')) {
            console.log('📍 주소는 인천입니다!');
            // 인천 미추홀구 올바른 좌표: 약 37.4477, 126.6502
            console.log('✅ 인천 미추홀구 올바른 좌표: 약 (37.4477, 126.6502)');
        }
        console.log('');
    }
}

checkFacility().catch(console.error);
