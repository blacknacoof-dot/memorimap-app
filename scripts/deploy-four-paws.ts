
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function deployFourPaws() {
    console.log("📸 포포즈 김포점 이미지 업데이트 중...");

    const targetId = 36; // From previous check
    const imageUrl1 = '/four_paws_gimpo_1.png'; // Local path in public
    const imageUrl2 = '/four_paws_gimpo_2.jpg';

    // 1. Update Main Image
    const { error: updateError } = await supabase
        .from('memorial_spaces')
        .update({ 
            image_url: imageUrl1,
            is_verified: true, // User verified
            data_source: 'user_request_verified'
        })
        .eq('id', targetId);

    if (updateError) console.error("Update Error:", updateError);
    else console.log("✅ 메인 이미지 업데이트 완료");

    // 2. Check facility_images table
    const { data: hasImageTable, error: tableError } = await supabase
        .from('facility_images')
        .select('*')
        .limit(1);
    
    if (!tableError) {
        // Table exists, insert both
        console.log("Adding additional images...");
        const newImages = [
            { facility_id: targetId, image_url: imageUrl1, caption: '전경1' },
            { facility_id: targetId, image_url: imageUrl2, caption: '전경2' }
        ];
        
        // Check if allow insert, depends on RLS or schema. Admin role should be fine.
        // Assuming schema has facility_id, image_url
        const { error: insertError } = await supabase
            .from('facility_images')
            .insert(newImages);

        if (insertError) console.error("Image Insert Error:", insertError);
        else console.log("✅ 추가 이미지 등록 완료");
    } else {
        console.log("ℹ️ facility_images 테이블이 없거나 접근 불가.");
    }
}

deployFourPaws();
