
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkFinalStats() {
    console.log("📊 최종 데이터 현황 점검...\n");

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, type, image_url, is_verified, data_source');

    if (error) {
        console.error(error);
        return;
    }

    const stats = {
        funeral: { total: 0, withPhoto: 0, verified: 0 },
        charnel: { total: 0, withPhoto: 0, verified: 0 },
        natural: { total: 0, withPhoto: 0, verified: 0 },
        sea: { total: 0, withPhoto: 0, verified: 0 },
        park: { total: 0, withPhoto: 0, verified: 0 }, // includes complex
        pet: { total: 0, withPhoto: 0, verified: 0 },
        other: { total: 0, withPhoto: 0, verified: 0 }
    };

    facilities?.forEach(f => {
        let category: keyof typeof stats = 'other';
        if (f.type === 'funeral') category = 'funeral';
        else if (f.type === 'charnel') category = 'charnel';
        else if (f.type === 'natural') category = 'natural';
        else if (f.type === 'sea') category = 'sea';
        else if (f.type === 'park' || f.type === 'complex') category = 'park';
        else if (f.type === 'pet') category = 'pet';

        stats[category].total++;
        if (f.image_url && !f.image_url.includes('unsplash')) stats[category].withPhoto++;
        if (f.is_verified) stats[category].verified++;
    });

    console.log(`| 구분 | 전체 (Total) | 사진 있음 (Real Photo) | 검증됨 (Verified) |`);
    console.log(`| :--- | :--- | :--- | :--- |`);
    console.log(`| **장례식장 (Funeral)** | ${stats.funeral.total} | ${stats.funeral.withPhoto} | ${stats.funeral.verified} |`);
    console.log(`| **봉안시설 (Charnel)** | ${stats.charnel.total} | ${stats.charnel.withPhoto} | ${stats.charnel.verified} |`);
    console.log(`| **자연장/수목장 (Natural)** | ${stats.natural.total} | ${stats.natural.withPhoto} | ${stats.natural.verified} |`);
    console.log(`| **해양장 (Sea)** | ${stats.sea.total} | ${stats.sea.withPhoto} | ${stats.sea.verified} |`);
    console.log(`| **공원묘지 (Park/Complex)** | ${stats.park.total} | ${stats.park.withPhoto} | ${stats.park.verified} |`);
    console.log(`| **동물장묘 (Pet)** | ${stats.pet.total} | ${stats.pet.withPhoto} | ${stats.pet.verified} |`);
    console.log(`| **기타 (Other)** | ${stats.other.total} | ${stats.other.withPhoto} | ${stats.other.verified} |`);

    console.log("\n✅ 상태 요약:");
    const total = facilities?.length || 0;
    const totalPhoto = Object.values(stats).reduce((acc, curr) => acc + curr.withPhoto, 0);
    console.log(`- 총 시설 수: ${total}개`);
    console.log(`- 사진 보유율: ${((totalPhoto / total) * 100).toFixed(1)}%`);
}

checkFinalStats();
