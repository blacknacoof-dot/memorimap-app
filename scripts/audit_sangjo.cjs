/**
 * 상조서비스(funeral_companies) 분류/이미지 검수
 * 실행: node scripts/audit_sangjo.cjs
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function audit() {
    console.log('=== 상조서비스 (funeral_companies) 검수 ===\n');

    const { data: all, error } = await supabase
        .from('funeral_companies')
        .select('id, name, image_url, phone, rating, review_count, description')
        .order('name');

    if (error) { console.error('DB 오류:', error.message); return; }

    console.log(`총 상조서비스 수: ${all.length}\n`);

    // category별 분포
    const catCounts = {};
    all.forEach(f => {
        const c = '상조';
        catCounts[c] = (catCounts[c] || 0) + 1;
    });
    console.log('--- category별 분포 ---');
    Object.entries(catCounts).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
        console.log(`  ${c}: ${n}건`);
    });

    // 이미지 없는 상조
    const noImage = all.filter(f => !f.image_url || f.image_url.trim() === '' || f.image_url.includes('placeholder'));
    console.log(`\n--- 이미지 없는 상조 (${noImage.length}건) ---`);
    noImage.forEach(f => {
        console.log(`  [${f.name}] ${f.name} | image: ${f.image_url || 'NULL'}`);
    });

    // 중복 이름
    const nameCount = {};
    all.forEach(f => {
        nameCount[f.name] = (nameCount[f.name] || []);
        nameCount[f.name].push(f);
    });
    const dupes = Object.entries(nameCount).filter(([, arr]) => arr.length > 1);
    console.log(`\n--- 이름 중복 (${dupes.length}건) ---`);
    dupes.forEach(([name, arr]) => {
        console.log(`  🔁 "${name}" x${arr.length}`);
        arr.forEach(f => console.log(`     [${f.name}] id=${f.id} | phone=${f.phone}`));
    });

    // 동물장례가 상조에 들어있는 경우
    const PET_KW = ['펫', 'pet', '21그램', '동물', '반려', '파트라슈', '스카이펫', '굿바이엔젤', '해피엔딩', '모두펫', '펫바라기', '포포즈', '펫포레스트', '펫문'];
    const petInSangjo = all.filter(f => {
        const name = f.name.toLowerCase();
        return PET_KW.some(k => name.includes(k));
    });
    console.log(`\n--- 상조에 동물장례 섞인 건 (${petInSangjo.length}건) ---`);
    petInSangjo.forEach(f => {
        console.log(`  ❌ [${f.name}] ${f.name}`);
    });

    // 시설(장례식장/봉안시설 등)이 상조에 들어있는 경우
    const FACILITY_KW = ['장례식장', '추모공원', '봉안당', '봉안시설', '납골당', '묘지', '화장장', '수목장'];
    const facilityInSangjo = all.filter(f => {
        const name = f.name.toLowerCase();
        return FACILITY_KW.some(k => name.includes(k));
    });
    console.log(`\n--- 상조에 시설 섞인 건 (${facilityInSangjo.length}건) ---`);
    facilityInSangjo.forEach(f => {
        console.log(`  ❌ [${f.name}] ${f.name}`);
    });

    // 전체 목록 (카테고리별)
    console.log('\n--- 전체 상조 목록 ---');
    const grouped = {};
    all.forEach(f => {
        const c = '상조';
        if (!grouped[c]) grouped[c] = [];
        grouped[c].push(f);
    });
    Object.entries(grouped).forEach(([cat, items]) => {
        console.log(`\n[${cat}] (${items.length}건)`);
        items.forEach(f => {
            const img = f.image_url ? '✅' : '❌';
            console.log(`  ${img} ${f.name} | rating=${f.rating} | reviews=${f.review_count}`);
        });
    });

    console.log('\n=== 상조 검수 완료 ===');
}

audit().catch(console.error);
