import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';
const supabase = createClient(supabaseUrl, supabaseKey);

interface PriceItem {
    category: string;
    subCategory: string;
    name: string;
    detail: string;
    price: number;
    priceDisplay: string;
}

interface FacilityPrices {
    facilityName: string;
    prices: PriceItem[];
}

async function analyzeMatching() {
    // 상세 가격 데이터 로드
    const pricesPath = join(__dirname, '..', 'funeral_prices_detailed.json');
    const pricesData: FacilityPrices[] = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));

    console.log(`📊 가격 데이터: ${pricesData.length}개 시설\n`);

    // DB 전체 장례식장 조회
    let allFacilities: any[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, prices')
            .eq('type', 'funeral')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('조회 오류:', error.message);
            break;
        }

        if (data && data.length > 0) {
            allFacilities = [...allFacilities, ...data];
            if (data.length < pageSize) break;
            page++;
        } else {
            break;
        }
    }

    console.log(`🏢 DB 장례식장: ${allFacilities.length}개\n`);

    // 매칭 분석
    let matched = 0;
    let alreadyHasPrices = 0;
    let needsUpdate = 0;
    const unmatched: string[] = [];
    const matchedList: { dbName: string; csvName: string; hasExistingPrices: boolean }[] = [];

    for (const fac of allFacilities) {
        // 이미 prices가 있는지 확인
        const hasPrices = fac.prices && Array.isArray(fac.prices) && fac.prices.length > 0;
        if (hasPrices) {
            alreadyHasPrices++;
        }

        // 가격 데이터 매칭 시도
        const priceInfo = pricesData.find(p => {
            const pName = p.facilityName?.replace(/[()]/g, '').replace(/\s/g, '').toLowerCase();
            const fName = fac.name?.replace(/[()]/g, '').replace(/\s/g, '').toLowerCase();

            // 완전 일치 또는 부분 일치
            if (pName === fName) return true;
            if (pName?.includes(fName) || fName?.includes(pName)) return true;

            // 주요 키워드 매칭 (병원명, 지역명 등)
            const pWords = pName?.split(/장례식장|장례문화원|장례원/).filter(Boolean) || [];
            const fWords = fName?.split(/장례식장|장례문화원|장례원/).filter(Boolean) || [];

            for (const pw of pWords) {
                for (const fw of fWords) {
                    if (pw && fw && pw.length > 2 && fw.length > 2) {
                        if (pw.includes(fw) || fw.includes(pw)) return true;
                    }
                }
            }

            return false;
        });

        if (priceInfo) {
            matched++;
            matchedList.push({
                dbName: fac.name,
                csvName: priceInfo.facilityName,
                hasExistingPrices: hasPrices
            });

            if (!hasPrices) {
                needsUpdate++;
            }
        } else {
            unmatched.push(fac.name);
        }
    }

    // 결과 출력
    console.log('=== 매칭 결과 ===\n');
    console.log(`✅ 매칭됨: ${matched}개 (${(matched / allFacilities.length * 100).toFixed(1)}%)`);
    console.log(`   - 이미 가격 있음: ${alreadyHasPrices}개`);
    console.log(`   - 업데이트 필요: ${needsUpdate}개`);
    console.log(`❌ 매칭 안됨: ${unmatched.length}개 (${(unmatched.length / allFacilities.length * 100).toFixed(1)}%)`);

    console.log('\n=== 매칭 안 된 시설 샘플 (20개) ===\n');
    for (const name of unmatched.slice(0, 20)) {
        console.log(`  - ${name}`);
    }

    // 요약 저장
    const summary = {
        totalDbFacilities: allFacilities.length,
        totalPriceData: pricesData.length,
        matched,
        alreadyHasPrices,
        needsUpdate,
        unmatched: unmatched.length
    };

    console.log('\n=== 요약 ===');
    console.log(JSON.stringify(summary, null, 2));
}

analyzeMatching().catch(console.error);
