/**
 * 부산 연안 해양장 데이터 업데이트 스크립트
 * 웹 검색으로 수집한 가격 정보 및 서비스 내용 반영
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateBusanSeaBurial() {
    console.log("🌊 부산 연안 해양장 데이터 업데이트 시작...\n");

    // 1. 시설 찾기
    const { data: facilities, error: findError } = await supabase
        .from('memorial_spaces')
        .select('*')
        .ilike('name', '%부산%해양%');

    if (findError) {
        console.error("검색 오류:", findError.message);
        return;
    }

    if (!facilities || facilities.length === 0) {
        console.log("❌ '부산 연안 해양장' 시설을 찾을 수 없습니다.");
        return;
    }

    console.log(`✅ ${facilities.length}개의 해양장 시설 발견:`);
    facilities.forEach(f => console.log(`   - [${f.id}] ${f.name}`));

    // 2. 업데이트할 데이터 (웹 검색 결과 기반)
    const updateData = {
        description: "부산 앞바다의 푸른 물결 위에서 고인을 자유롭게 보내드리는 고품격 해양 장례 서비스입니다. 수영만 요트경기장에서 출항하며, GPS 기반 해상 안장확인서를 발급해드립니다. 소요 시간은 약 60분입니다.",
        price_range: "30~80만원",
        image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
        phone: "051-744-1004",
        // 가격 정보 (priceInfo 컬럼에 JSONB로 저장)
        priceInfo: {
            items: [
                { item: "가족 해양장 (6인)", category: "기본 서비스", price: "300,000원" },
                { item: "가족 해양장 (10인)", category: "기본 서비스", price: "400,000~500,000원" },
                { item: "가족 해양장 (20인)", category: "기본 서비스", price: "600,000원" },
                { item: "가족 해양장 (30인)", category: "기본 서비스", price: "700,000~800,000원" },
                { item: "위령제/제사상", category: "추가 서비스", price: "100,000원" },
                { item: "헌화용 국화", category: "추가 서비스", price: "30,000원" },
            ]
        },
        // 갤러리 이미지
        gallery_images: [
            "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=600&auto=format&fit=crop"
        ]
    };

    // 3. 각 시설 업데이트
    for (const facility of facilities) {
        console.log(`\n🔄 [${facility.id}] ${facility.name} 업데이트 중...`);

        const { error: updateError } = await supabase
            .from('memorial_spaces')
            .update(updateData)
            .eq('id', facility.id);

        if (updateError) {
            console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
        } else {
            console.log(`   ✅ 업데이트 완료!`);
        }
    }

    console.log("\n🎉 모든 업데이트 완료!");
}

updateBusanSeaBurial().catch(console.error);
