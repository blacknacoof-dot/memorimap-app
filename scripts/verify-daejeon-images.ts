import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyImages() {
    console.log('=== 대전 장례식장 이미지 검증 ===\n');

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('name, image_url, gallery_images, address, description')
        .or('address.ilike.%대전%,address.ilike.%대전광역시%');

    if (error) {
        console.error('조회 오류:', error.message);
        return;
    }

    // 장례식장만 필터
    const funeralHomes = (facilities || []).filter(f =>
        f.name?.includes('장례') || f.name?.includes('병원')
    );

    console.log(`총 ${funeralHomes.length}개 시설\n`);

    let withImage = 0;
    let withoutImage = 0;
    let withDescription = 0;

    for (const f of funeralHomes) {
        const hasImage = f.image_url && f.image_url.trim() !== '' && !f.image_url.includes('unsplash');
        const hasDesc = f.description && f.description.trim() !== '';

        if (hasImage) withImage++;
        else withoutImage++;
        if (hasDesc) withDescription++;

        console.log(`${hasImage ? '✅' : '❌'} ${f.name}`);
        console.log(`   대표이미지: ${f.image_url ? f.image_url.substring(0, 60) + '...' : '없음'}`);
        console.log(`   갤러리: ${f.gallery_images?.length || 0}개`);
        console.log(`   소개: ${hasDesc ? '있음' : '없음'}`);
        console.log('');
    }

    console.log('\n=== 요약 ===');
    console.log(`대표이미지 있음: ${withImage}개`);
    console.log(`대표이미지 없음: ${withoutImage}개`);
    console.log(`소개 있음: ${withDescription}개`);
}

verifyImages().catch(console.error);
