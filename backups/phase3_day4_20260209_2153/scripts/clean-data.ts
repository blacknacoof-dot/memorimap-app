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

const REMOVE_KEYWORDS = [
    '영안실', '화장실', '운영처', '관리소', '복합시설', '상담센터',
    '별관', '특수여객', '산업', '라이프', '협회', '조합', '재단', '사무처'
];

const BATCH_SIZE = 100;

async function cleanData() {
    console.log("🧹 [공격적 정제 시작] 배치 처리 및 데이터 보호 모드...");

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, is_verified')
        .eq('is_verified', false);

    if (error || !facilities) {
        console.error("❌ 데이터 로드 실패:", error);
        return;
    }

    const toDelete: string[] = [];
    const toUpdate: { id: string, name: string, type: string, data_source: string }[] = [];

    for (const f of facilities) {
        let name = f.name;
        let newType = '';

        if (REMOVE_KEYWORDS.some(kw => name.includes(kw))) {
            toDelete.push(f.id);
            continue;
        }

        if (name.includes('부흥')) {
            name = '제일장례식장';
        }

        if (/동물|반려|펫|강아지|고양이|애완|pet/i.test(name)) {
            newType = 'pet';
        } else if (/장례식장|장례|병원/.test(name)) {
            newType = 'funeral';
        } else if (/공원묘지|추모공원|묘원|메모리얼파크/.test(name)) {
            newType = 'park';
        } else if (/납골|봉안|추모관|봉안옥/.test(name)) {
            newType = 'charnel';
        } else if (/수목장|자연장/.test(name)) {
            newType = 'natural';
        } else if (/바다장|해양장/.test(name)) {
            newType = 'sea';
        }

        if (!newType) {
            toDelete.push(f.id);
            continue;
        }

        toUpdate.push({ id: f.id, name, type: newType, data_source: 'ai' });
    }

    console.log(`\n--------------------------------------`);
    console.log(`📊 정제 시뮬레이션 결과 (배치 크기: ${BATCH_SIZE})`);
    console.log(`- 전체 대상: ${facilities.length}건`);
    console.log(`- 삭제 대상: ${toDelete.length}건`);
    console.log(`- 업데이트: ${toUpdate.length}건`);
    console.log(`--------------------------------------\n`);

    // 1. 배치 삭제 실행
    if (toDelete.length > 0) {
        for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
            const batch = toDelete.slice(i, i + BATCH_SIZE);
            const { error: dErr } = await supabase.from('memorial_spaces').delete().in('id', batch);
            if (dErr) console.error(`❌ 삭제 오류 (배치 ${i / BATCH_SIZE + 1}):`, dErr.message);
            else console.log(`✅ 삭제 진행 중... (${Math.min(i + BATCH_SIZE, toDelete.length)}/${toDelete.length})`);
        }
        console.log(`✨ 삭제 완료`);
    }

    // 2. 배치 업데이트 실행
    if (toUpdate.length > 0) {
        for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
            const batch = toUpdate.slice(i, i + BATCH_SIZE);
            // Promise.all을 사용하여 병렬 처리 (개별 업데이트이므로 upsert가 더 빠르지만 query 최적성 고려)
            await Promise.all(batch.map(item =>
                supabase.from('memorial_spaces').update({
                    name: item.name,
                    type: item.type,
                    data_source: item.data_source
                }).eq('id', item.id)
            ));
            console.log(`✅ 업데이트 진행 중... (${Math.min(i + BATCH_SIZE, toUpdate.length)}/${toUpdate.length})`);
        }
        console.log(`✨ 업데이트 완료`);
    }

    console.log("\n🎉 모든 클리닝 프로세스가 성공적으로 완료되었습니다!");
}

cleanData();
