import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFacility() {
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .or('name.ilike.%수원병원%,name.ilike.%경기도의료원%수원%');

    if (error) {
        console.error('오류:', error.message);
        return;
    }

    if (data && data.length > 0) {
        for (const f of data) {
            console.log('=== 시설 정보 ===');
            console.log('이름:', f.name);
            console.log('주소:', f.address);
            console.log('전화:', f.phone);
            console.log('대표이미지:', f.image_url ? (f.image_url.includes('unsplash') ? '❌ Unsplash' : '✅ 있음') : '❌ 없음');
            console.log('갤러리:', f.gallery_images?.length || 0, '개');
            console.log('가격:', f.price_range || '없음');
            console.log('prices:', f.prices?.length || 0, '개');
            console.log('');
        }
    } else {
        console.log('❌ 검색 결과 없음');

        // 비슷한 이름 검색
        const { data: similar } = await supabase
            .from('memorial_spaces')
            .select('name')
            .ilike('name', '%수원%');

        if (similar && similar.length > 0) {
            console.log('\n비슷한 이름 검색 결과:');
            for (const s of similar) {
                console.log(' -', s.name);
            }
        }
    }
}

checkFacility().catch(console.error);
