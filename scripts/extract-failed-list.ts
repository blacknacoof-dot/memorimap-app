/**
 * 동기화 실패 시설 목록 추출
 * - sync_naver_log.txt에서 NOT FOUND, SKIP 추출
 * - naver_geocode_log.txt에서 NOT FOUND, GEO FAIL 추출
 * - CSV로 저장
 */

import * as fs from 'fs';

function extractFailedFacilities() {
    const results: { id: string; name: string; reason: string; source: string }[] = [];

    // 1. sync_naver_log.txt 분석
    if (fs.existsSync('sync_naver_log.txt')) {
        const syncLog = fs.readFileSync('sync_naver_log.txt', 'utf-8');
        const lines = syncLog.split('\n');

        for (const line of lines) {
            if (line.includes('[NOT FOUND]') || line.includes('[SKIP]')) {
                const match = line.match(/ID:(\d+)\s+(.+)/);
                if (match) {
                    results.push({
                        id: match[1],
                        name: match[2].split(' vs ')[0].trim(),
                        reason: line.includes('[NOT FOUND]') ? '검색 안됨' : '유사도 낮음',
                        source: '명칭/주소/전화 동기화'
                    });
                }
            }
        }
    }

    // 2. naver_geocode_log.txt 분석
    if (fs.existsSync('naver_geocode_log.txt')) {
        const geoLog = fs.readFileSync('naver_geocode_log.txt', 'utf-8');
        const lines = geoLog.split('\n');

        for (const line of lines) {
            if (line.includes('[NOT FOUND]') || line.includes('[GEO FAIL]')) {
                const match = line.match(/ID:(\d+)\s+(.+)/);
                if (match) {
                    // 중복 체크
                    const exists = results.find(r => r.id === match[1]);
                    if (!exists) {
                        results.push({
                            id: match[1],
                            name: match[2].trim(),
                            reason: '좌표 검색 실패',
                            source: '좌표 재계산'
                        });
                    }
                }
            }
        }
    }

    // CSV 생성
    const header = 'ID,시설명,실패사유,작업구분\n';
    const rows = results.map(r =>
        `${r.id},"${r.name}",${r.reason},${r.source}`
    ).join('\n');

    const csv = '\uFEFF' + header + rows;
    fs.writeFileSync('failed_facilities_list.csv', csv);

    console.log(`총 ${results.length}개 실패 시설 추출 완료`);
    console.log('파일 저장: failed_facilities_list.csv');
}

extractFailedFacilities();
