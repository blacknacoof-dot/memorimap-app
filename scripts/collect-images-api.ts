// 네이버 이미지 검색 API를 사용한 시설 이미지 수집 스크립트
// Selenium 크롤링보다 훨씬 안정적이고 빠릅니다

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import axios from 'axios';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const NAVER_CLIENT_ID = process.env.VITE_NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.VITE_NAVER_CLIENT_SECRET || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 설정
const OUTPUT_DIR = 'memorial_data_v1';
const MAX_IMAGES_PER_FACILITY = 5;

// 네이버 이미지 검색 API
async function searchImages(query: string, count: number = 5): Promise<string[]> {
    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/image', {
            params: {
                query: query,
                display: count,
                sort: 'sim',  // 유사도순
                filter: 'large'  // 큰 이미지
            },
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            }
        });

        return response.data.items?.map((item: any) => item.link) || [];
    } catch (e: any) {
        console.log(`  [검색 실패] ${e.message}`);
        return [];
    }
}

// 이미지 다운로드
async function downloadImage(url: string, filepath: string): Promise<boolean> {
    try {
        const response = await axios.get(url, {
            responseType: 'stream',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        await streamPipeline(response.data, fs.createWriteStream(filepath));
        return true;
    } catch (e: any) {
        // 조용히 실패 (로그 생략)
        return false;
    }
}

// 안전한 파일명 생성
function sanitizeFilename(name: string): string {
    return name.replace(/[\/\\:*?"<>|]/g, '_').substring(0, 50);
}

async function main() {
    console.log('='.repeat(60));
    console.log('  네이버 이미지 검색 API - 시설 이미지 수집');
    console.log('='.repeat(60));

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        console.error('[오류] VITE_NAVER_CLIENT_ID, VITE_NAVER_CLIENT_SECRET 환경변수가 필요합니다.');
        return;
    }

    // 출력 디렉토리 생성
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Supabase에서 시설 목록 가져오기
    console.log('\n[1/3] 시설 목록 불러오는 중...');
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, type')
        .order('id');

    if (error) {
        console.error('[오류] 시설 목록 조회 실패:', error.message);
        return;
    }

    console.log(`     총 ${facilities.length}개 시설 발견`);

    // 통계
    let processed = 0;
    let imagesSaved = 0;
    let skipped = 0;
    let noResults = 0;

    console.log('\n[2/3] 이미지 수집 시작...\n');

    for (const facility of facilities) {
        const safeName = sanitizeFilename(facility.name);
        const folderName = `${facility.id}_${safeName}`;
        const folderPath = path.join(OUTPUT_DIR, folderName);

        // 이미 3장 이상 있으면 스킵
        if (fs.existsSync(folderPath)) {
            const existing = fs.readdirSync(folderPath).filter(f =>
                f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg')
            );
            if (existing.length >= 3) {
                skipped++;
                continue;
            }
        }

        console.log(`[검색] ${facility.name}`);

        // 검색어 구성 (이름 + 타입 키워드)
        let searchQuery = facility.name;
        if (facility.type === 'charnel_house') {
            searchQuery += ' 봉안당';
        } else if (facility.type === 'funeral_hall') {
            searchQuery += ' 장례식장';
        } else if (facility.type === 'natural_burial') {
            searchQuery += ' 수목장';
        }

        const imageUrls = await searchImages(searchQuery, MAX_IMAGES_PER_FACILITY);

        if (imageUrls.length === 0) {
            console.log(`       -> 결과 없음`);
            noResults++;
            processed++;
            continue;
        }

        // 폴더 생성
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // 이미지 다운로드
        let savedCount = 0;
        for (let i = 0; i < imageUrls.length; i++) {
            const url = imageUrls[i];
            const ext = path.extname(url).split('?')[0] || '.jpg';
            const safeExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext.toLowerCase()) ? ext : '.jpg';
            const filename = `${i + 1}${safeExt}`;
            const filepath = path.join(folderPath, filename);

            const success = await downloadImage(url, filepath);
            if (success) {
                savedCount++;
                imagesSaved++;
            }
        }

        console.log(`       -> ${savedCount}장 저장됨`);
        processed++;

        // API rate limit 방지 (200ms 대기)
        await new Promise(r => setTimeout(r, 200));

        // 10개마다 진행 상황 표시
        if (processed % 10 === 0) {
            console.log(`\n--- 진행: ${processed}/${facilities.length} (${Math.round(processed / facilities.length * 100)}%) ---\n`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('  [완료] 이미지 수집 결과');
    console.log('='.repeat(60));
    console.log(`  처리됨: ${processed}개 시설`);
    console.log(`  스킵됨 (이미 완료): ${skipped}개`);
    console.log(`  결과 없음: ${noResults}개`);
    console.log(`  총 저장된 이미지: ${imagesSaved}장`);
    console.log(`\n  저장 위치: ${OUTPUT_DIR}/`);
    console.log('='.repeat(60));
}

main();
