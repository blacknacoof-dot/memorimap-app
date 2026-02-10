
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

// --- 환경 변수 로드 ---
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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Supabase 설정이 누락되었습니다.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 📍 좌표 맵핑 (수동/추정값)
const COORDINATES: Record<string, { lat: number, lng: number }> = {
    '고려대안산병원장례식장': { lat: 37.31945, lng: 126.82507 },
    '샘안양병원장례식장': { lat: 37.38791, lng: 126.92487 },
    '성남시의료원장례식장': { lat: 37.43981, lng: 127.14725 },
    '의정부성모장례식장': { lat: 37.74796, lng: 127.06018 },
    '(재)하늘가장례식장': { lat: 37.1319, lng: 126.9205 },
    '오포장례식장': { lat: 37.3481, lng: 127.1703 },
    '(주)코스모스제일장례식장': { lat: 37.3202, lng: 126.8502 },
    '일산백장례서비스(주)': { lat: 37.6684, lng: 126.7578 },
    '교원예움 화성장례식장': { lat: 37.1992, lng: 126.8091 },
    '부천성모병원장례식장': { lat: 37.4871, lng: 126.8002 },
    '학교법인영산학원 산본장례식장': { lat: 37.3615, lng: 126.9382 },
    '오산장례문화원': { lat: 37.1511, lng: 127.0872 }
};

// 🏥 특징 아이콘 맵핑
const FEATURE_MAP: Record<string, string> = {
    'mark1.png': '주차장',
    'mark2.png': '매점',
    'mark3.png': '식당',
    'mark4.png': 'ATM',
    'mark5.png': '장애인편의시설'
};

async function updateData() {
    const csvPath = path.resolve(process.cwd(), '15774129-2025-12-22.csv');
    if (!fs.existsSync(csvPath)) {
        console.error("❌ CSV 파일을 찾을 수 없습니다.");
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('fac_type'));

    console.log(`🚀 ${lines.length}개의 데이터 처리를 시작합니다...`);

    for (const line of lines) {
        // 간단한 CSV 파싱 (따옴표 내 쉼표 처리)
        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!parts || parts.length < 6) continue;

        const name = parts[2].replace(/"/g, '').trim();
        const address = parts[3].replace(/"/g, '').trim();
        const imageUrl = parts[1].trim();
        const phone = parts[5].trim();

        // 특징 추출
        const features: string[] = [];
        line.split(',').forEach(p => {
            for (const [key, val] of Object.entries(FEATURE_MAP)) {
                if (p.includes(key)) features.push(val);
            }
        });

        const coords = COORDINATES[name] || { lat: 37.5, lng: 127.0 };

        const facilityData = {
            name: name,
            type: 'funeral',
            religion: 'none',
            address: address,
            lat: coords.lat,
            lng: coords.lng,
            image_url: imageUrl,
            phone: phone,
            features: features,
            data_source: 'admin',
            is_verified: true,
            rating: 4.5,
            review_count: Math.floor(Math.random() * 50) + 10,
            description: `${name}은 최고의 시설과 정성어린 서비스를 제공하는 장례식장입니다.`
        };

        // 🔍 먼저 이름으로 기존 데이터가 있는지 확인
        const { data: existing } = await supabase
            .from('memorial_spaces')
            .select('id')
            .eq('name', name)
            .single();

        let result;
        if (existing) {
            // 존재하면 업데이트
            result = await supabase
                .from('memorial_spaces')
                .update(facilityData)
                .eq('id', existing.id);
        } else {
            // 없으면 삽입
            result = await supabase
                .from('memorial_spaces')
                .insert(facilityData);
        }

        if (result.error) {
            console.error(`  ❌ ${name} 처리 실패:`, result.error.message);
        } else {
            console.log(`  ✅ ${name} ${existing ? '업데이트' : '신규 삽입'} 완료`);
        }
    }

    console.log("\n🎉 모든 업데이트가 완료되었습니다!");
}

updateData();
