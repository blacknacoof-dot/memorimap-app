
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkCemeteryPhotos() {
    console.log("🔍 묘지 시설 사진 현황 점검 중...\n");

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, image_url, data_source')
        .in('type', ['park', 'complex']);

    if (error) {
        console.error("Error fetching facilities:", error);
        return;
    }

    const total = facilities.length;
    let withPhoto = 0;
    let withoutPhoto = 0;
    let defaultPhoto = 0;
    let unsplashPhoto = 0;
    const noPhotoList: string[] = [];

    const defaultImages = [
        'https://via.placeholder.com/800x600?text=No+Image',
        'https://images.unsplash.com/photo', // Generic unsplash match if used as fallback
    ];

    for (const f of facilities) {
        if (!f.image_url) {
            withoutPhoto++;
            noPhotoList.push(`[${f.type}] ${f.name} (Source: ${f.data_source})`);
        } else if (f.image_url.includes('via.placeholder.com')) {
            defaultPhoto++;
            withoutPhoto++; // Treat placeholder as no photo
            noPhotoList.push(`[${f.type}] ${f.name} (Placeholder)`);
        } else if (f.image_url.includes('images.unsplash.com')) {
            unsplashPhoto++;
            withPhoto++;
        } else {
            withPhoto++;
        }
    }

    console.log(`📊 전체 묘지 시설: ${total}개`);
    console.log(`✅ 사진 있음: ${withPhoto}개 (Unsplash: ${unsplashPhoto}개)`);
    console.log(`❌ 사진 없음: ${withoutPhoto}개 (Null 또는 Placeholder)`);
    console.log(`\n📸 사진 보유율: ${((withPhoto / total) * 100).toFixed(1)}%`);

    console.log(`\n📋 사진이 없는 시설 (상위 20개):`);
    noPhotoList.slice(0, 20).forEach(name => console.log(`   - ${name}`));

    if (noPhotoList.length > 20) {
        console.log(`   ... 외 ${noPhotoList.length - 20}개`);
    }
}

checkCemeteryPhotos();
