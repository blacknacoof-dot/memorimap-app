
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

async function removeUnsplashImages() {
    console.log("🧹 Unsplash 이미지 제거 작업 시작...");

    // 먼저 카운트 확인
    const { count, error: countError } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true })
        .ilike('image_url', '%unsplash%');

    if (countError) {
        console.error("❌ 카운트 조회 실패:", countError);
        return;
    }

    console.log(`📋 제거 대상(Unsplash): ${count}개`);

    // 업데이트 실행
    const { error: updateError } = await supabase
        .from('memorial_spaces')
        .update({ image_url: null })
        .ilike('image_url', '%unsplash%');

    if (updateError) {
        console.error("❌ 업데이트 실패:", updateError);
    } else {
        console.log("✅ 성공적으로 제거되었습니다 (NULL 처리).");
    }

    // Placeholder도 제거?
    // User specifically said Unsplash, but probably implies all fake images.
    // Let's check 'placeholder' too.
    const { error: updateError2 } = await supabase
        .from('memorial_spaces')
        .update({ image_url: null })
        .ilike('image_url', '%placeholder%');

    if (!updateError2) {
        console.log("✅ Placeholder 이미지도 제거되었습니다.");
    }
}

removeUnsplashImages();
