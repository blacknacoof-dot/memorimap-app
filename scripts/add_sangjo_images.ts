import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 상조 회사별 이미지 (Unsplash 고품질 이미지)
const COMPANY_IMAGES = {
    '프리드라이프': {
        main: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400',
        gallery: [
            'https://images.unsplash.com/photo-1560439514-4e9645039924?w=400',
            'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400',
            'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400'
        ]
    },
    '교원라이프': {
        main: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
        gallery: [
            'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400',
            'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=400',
            'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400'
        ]
    },
    '대명스테이션': {
        main: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
        gallery: [
            'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400',
            'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400',
            'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400'
        ]
    },
    '더케이예다함': {
        main: 'https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=400',
        gallery: [
            'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400',
            'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=400',
            'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400'
        ]
    },
    'default': {
        main: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400',
        gallery: [
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400',
            'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400',
            'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400'
        ]
    }
};

async function addImagesToSangjoCompanies() {
    console.log('🖼️  상조 회사에 이미지 추가 중...\n');

    // 모든 상조 회사 조회
    const { data: companies, error } = await supabase
        .from('funeral_companies')
        .select('id, name');

    if (error || !companies) {
        console.error('❌ 회사 조회 실패:', error);
        return;
    }

    console.log(`📋 총 ${companies.length}개 회사 발견\n`);

    let updated = 0;

    for (const company of companies) {
        const images = COMPANY_IMAGES[company.name as keyof typeof COMPANY_IMAGES] || COMPANY_IMAGES.default;

        const { error: updateError } = await supabase
            .from('funeral_companies')
            .update({
                image_url: images.main,
                gallery_images: images.gallery
            })
            .eq('id', company.id);

        if (updateError) {
            console.error(`❌ ${company.name} 업데이트 실패:`, updateError.message);
        } else {
            console.log(`✅ ${company.name}: 메인 이미지 + 갤러리 3장 추가`);
            updated++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ ${updated}개 회사 이미지 업데이트 완료!`);
    console.log('='.repeat(60));
}

addImagesToSangjoCompanies();
