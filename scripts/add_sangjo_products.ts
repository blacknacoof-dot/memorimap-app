import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 상조 서비스 상품 템플릿
const SANGJO_PRODUCTS = [
    {
        name: '베이직형',
        price: 3500000,
        badges: ['기본형'],
        tagline: '합리적인 가격의 기본 상조 서비스',
        description: '장례 의전에 필요한 기본 서비스를 제공합니다.',
        serviceDetails: [
            { category: '의전', items: ['영정사진 제작', '부고 안내', '접객 지원'] },
            { category: '장례용품', items: ['수의 1벌', '관 1구', '제단 화환'] },
            { category: '장지', items: ['장지 안내 서비스'] }
        ]
    },
    {
        name: '스탠다드형',
        price: 5000000,
        badges: ['표준형'],
        tagline: '가장 많이 선택하는 표준 서비스',
        description: '합리적인 가격에 충실한 서비스를 제공합니다.',
        serviceDetails: [
            { category: '의전', items: ['영정사진 제작', '부고 안내', '접객 지원', '사회자 파견'] },
            { category: '장례용품', items: ['고급 수의 1벌', '고급관 1구', '제단 화환 3개', '근조 화환 제공'] },
            { category: '장지', items: ['장지 예약 대행', '이동차량 지원'] },
            { category: '추가', items: ['식사 50인분', '답례품 제공'] }
        ]
    },
    {
        name: '프리미엄형',
        price: 10000000,
        badges: ['고급형'],
        tagline: '최상의 서비스로 고인을 예우하는 프리미엄 상조',
        description: '최고급 서비스로 품격있는 마지막 인사를 준비합니다.',
        serviceDetails: [
            { category: '의전', items: ['전문 사회자', '의전팀 24시간 상주', '부고 전문 제작 및 발송'] },
            { category: '장례용품', items: ['최고급 수의', '최고급 관', '제단 화환 10개', '근조 화환 무제한'] },
            { category: '장지', items: ['명당 장지 컨설팅', '프리미엄 이동차량', '장지 VIP 예약'] },
            { category: '추가', items: ['식사 100인분', '고급 답례품', '추모 영상 제작'] }
        ]
    }
];

async function addProductsAndGallery() {
    console.log('🛍️ 상조 회사에 서비스 구성 및 갤러리 추가 중...\n');

    const { data: companies, error } = await supabase
        .from('funeral_companies')
        .select('id, name');

    if (error || !companies) {
        console.error('❌ 회사 조회 실패:', error);
        return;
    }

    let updated = 0;

    for (const company of companies) {
        const { error: updateError } = await supabase
            .from('funeral_companies')
            .update({
                price_info: { products: SANGJO_PRODUCTS }
            })
            .eq('id', company.id);

        if (updateError) {
            console.error(`❌ ${company.name}:`, updateError.message);
        } else {
            console.log(`✅ ${company.name}: 서비스 구성 3개 추가`);
            updated++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ ${updated}개 회사 서비스 구성 업데이트 완료!`);
    console.log('='.repeat(60));
}

addProductsAndGallery();
