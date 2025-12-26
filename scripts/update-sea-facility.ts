import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split(/\r?\n/).forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                if (value) process.env[key.trim()] = value;
            }
        });
    }
}

loadEnv();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function updateSeaFacility() {
    console.log("🌊 강릉바다해양장 정보 반영을 시작합니다...");

    const name = "강릉바다해양장";
    const address = "강원 강릉시 사천면 진리항구길 47 1층";
    const prices = [
        { "type": "바다장례", "price": "500,000원 ~ 800,000원 (운항60분, 장례지도사 1명)" },
        { "type": "추모독선", "price": "300,000원 (운항60분, 방문추모)" },
        { "type": "제사", "price": "상담 (삼우제, 기우제, 49재 등)" }
    ];

    // 1. 유사 명칭으로 기존 시설 검색
    const { data: results } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .or(`name.ilike.%강릉%,name.ilike.%해양장%,name.ilike.%바다장%`);

    const existing = results?.find(f => f.name.includes('강릉') && (f.name.includes('해양') || f.name.includes('바다')));

    const facilityData: any = {
        name: name,
        type: 'sea',
        religion: 'none',
        address: address,
        lat: 37.834789,
        lng: 128.877843,
        prices: prices,
        description: "강릉 사천항에서 진행되는 경건한 바다장례 서비스입니다. 정성을 다해 고인을 모십니다.",
        features: ["장례지도사 동행", "60분 운항", "방문추모 가능", "사천항 위치"],
        phone: "033-000-0000"
    };

    if (existing) {
        console.log(`✅ 기존 시설 발견 (ID: ${existing.id}, Name: ${existing.name}), 정보를 업데이트합니다.`);
        const { error } = await supabase
            .from('memorial_spaces')
            .update(facilityData)
            .eq('id', existing.id);

        if (error) console.error("❌ 업데이트 실패:", error.message);
        else console.log("🎉 업데이트 완료!");
    } else {
        console.log("🆕 일치하는 시설이 없어 새로 생성합니다. (ID 자동 할당)");
        // ID를 제외하고 insert하여 serial/identity 적용
        const { data: inserted, error } = await supabase
            .from('memorial_spaces')
            .insert(facilityData)
            .select();

        if (error) {
            console.error("❌ 생성 실패:", error.message);
            if (error.message.includes('id')) {
                console.log("💡 ID 수동 할당을 시도합니다...");
                // 만약 ID가 필수라면 아주 큰 숫자를 사용 (기존 1000번대와 겹치지 않게)
                await supabase.from('memorial_spaces').insert({
                    id: 9999,
                    ...facilityData
                });
            }
        } else {
            console.log(`🎉 새 시설 생성 완료! (ID: ${inserted?.[0]?.id})`);
        }
    }
}

updateSeaFacility();
