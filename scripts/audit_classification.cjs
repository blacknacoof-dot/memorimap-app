/**
 * DB 분류/이미지 종합 검수 스크립트
 * 실행: node scripts/audit_classification.cjs
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function audit() {
    console.log('=== Memorimap 시설 분류/이미지 종합 검수 ===\n');

    // 1. 전체 시설 조회
    const { data: all, error } = await supabase
        .from('facilities')
        .select('id, name, type, address, image_url, verified')
        .order('type')
        .order('name');

    if (error) { console.error('DB 오류:', error.message); return; }

    console.log(`총 시설 수: ${all.length}\n`);

    // 2. type별 분포
    const typeCounts = {};
    all.forEach(f => {
        const t = f.type || '(없음)';
        typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    console.log('--- type별 분포 ---');
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => {
        console.log(`  ${t}: ${c}건`);
    });

    // 3. 이미지 없는 시설
    const noImage = all.filter(f => !f.image_url || f.image_url.trim() === '' || f.image_url.includes('placeholder'));
    console.log(`\n--- 이미지 없는 시설 (${noImage.length}건) ---`);
    noImage.forEach(f => {
        console.log(`  [${f.type}] ${f.name} | ${f.address || '주소없음'} | image: ${f.image_url || 'NULL'}`);
    });

    // 4. 봉안시설(columbarium)에 장례식장/상조 섞인 건
    const FUNERAL_KEYWORDS = ['장례식장', '장례서비스', '장의', '장례'];
    const SANGJO_KEYWORDS = ['상조', '라이프', '보람'];
    const PET_KEYWORDS = ['펫', 'pet', '21그램', '동물', '반려'];

    const columbarium = all.filter(f => f.type === 'columbarium');
    const columbariumWrong = columbarium.filter(f => {
        const name = f.name.toLowerCase();
        return FUNERAL_KEYWORDS.some(k => name.includes(k))
            || SANGJO_KEYWORDS.some(k => name.includes(k))
            || PET_KEYWORDS.some(k => name.includes(k));
    });
    console.log(`\n--- 봉안시설(columbarium) 분류 의심 (${columbariumWrong.length}건) ---`);
    columbariumWrong.forEach(f => {
        console.log(`  ❌ ${f.name} | ${f.address || ''}`);
    });

    // 5. 장례식장(funeral_home)에 상조/펫 섞인 건
    const funeral = all.filter(f => f.type === 'funeral_home');
    const funeralWrong = funeral.filter(f => {
        const name = f.name.toLowerCase();
        return SANGJO_KEYWORDS.some(k => name.includes(k))
            || PET_KEYWORDS.some(k => name.includes(k));
    });
    console.log(`\n--- 장례식장(funeral_home) 분류 의심 (${funeralWrong.length}건) ---`);
    funeralWrong.forEach(f => {
        console.log(`  ❌ ${f.name} | ${f.address || ''}`);
    });

    // 6. 상조서비스(sangjo)에 시설/펫 섞인 건
    const sangjo = all.filter(f => f.type === 'sangjo');
    const sangjoWrong = sangjo.filter(f => {
        const name = f.name.toLowerCase();
        return PET_KEYWORDS.some(k => name.includes(k))
            || FUNERAL_KEYWORDS.some(k => name.includes(k));
    });
    console.log(`\n--- 상조(sangjo) 분류 의심 (${sangjoWrong.length}건) ---`);
    sangjoWrong.forEach(f => {
        console.log(`  ❌ ${f.name} | ${f.address || ''}`);
    });

    // 7. 동물장례(pet_funeral)에 일반 시설 섞인 건
    const pet = all.filter(f => f.type === 'pet_funeral');
    const petCheck = pet.filter(f => {
        const name = f.name.toLowerCase();
        return !PET_KEYWORDS.some(k => name.includes(k))
            && !['21그램', '파트라슈', '스카이펫', '굿바이엔젤', '해피엔딩', '모두펫', '펫바라기', '포포즈', '펫포레스트', '펫문'].some(k => name.includes(k));
    });
    console.log(`\n--- 동물장례(pet_funeral) 분류 의심 (${petCheck.length}건) ---`);
    petCheck.forEach(f => {
        console.log(`  ⚠️ ${f.name} | ${f.address || ''}`);
    });

    // 8. 중복 이름
    const nameCount = {};
    all.forEach(f => {
        nameCount[f.name] = (nameCount[f.name] || []);
        nameCount[f.name].push(f);
    });
    const duplicates = Object.entries(nameCount).filter(([, arr]) => arr.length > 1);
    console.log(`\n--- 이름 중복 (${duplicates.length}건) ---`);
    duplicates.forEach(([name, arr]) => {
        console.log(`  🔁 "${name}" x${arr.length}`);
        arr.forEach(f => console.log(`     [${f.type}] id=${f.id} | ${f.address || ''}`));
    });

    // 9. type이 비표준인 시설
    const VALID_TYPES = ['funeral_home', 'columbarium', 'natural_burial', 'cemetery', 'pet_funeral', 'sea_burial', 'sangjo'];
    const invalidType = all.filter(f => !VALID_TYPES.includes(f.type));
    console.log(`\n--- 비표준 type (${invalidType.length}건) ---`);
    invalidType.forEach(f => {
        console.log(`  ⚠️ [${f.type}] ${f.name}`);
    });

    // 10. 상조서비스가 시설 목록에서 보이는 문제 확인
    console.log(`\n--- 상조(sangjo) 시설 목록 (지도에 표시되면 안 됨) ---`);
    console.log(`  sangjo type 시설: ${sangjo.length}건`);
    sangjo.slice(0, 20).forEach(f => {
        console.log(`  📋 ${f.name} | verified=${f.verified} | image=${f.image_url ? '있음' : 'NULL'}`);
    });

    console.log('\n=== 검수 완료 ===');
}

audit().catch(console.error);
