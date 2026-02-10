import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 설정 누락');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const COORD_THRESHOLD = 0.001; // ~100m
const DRY_RUN = true; // Set to false to actually delete

interface Facility {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    type: string;
    image_url: string;
    data_source: string;
    is_verified: boolean;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
}

function normalizeAddress(addr: string): string {
    return addr
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[()]/g, '')
        .replace(/특별시|광역시|특별자치시|특별자치도/g, '');
}

async function hybridDeduplication() {
    console.log('🔄 하이브리드 중복 제거 시작...\n');
    console.log(`모드: ${DRY_RUN ? 'DRY RUN (실제 삭제 안함)' : 'LIVE (실제 삭제)'}\n`);

    // Fetch all facilities
    let allFacilities: Facility[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, lat, lng, type, image_url, data_source, is_verified')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('❌ 조회 오류:', error);
            return;
        }

        if (!data || data.length === 0) break;

        allFacilities = allFacilities.concat(data as Facility[]);
        page++;

        if (data.length < pageSize) break;
    }

    console.log(`📋 총 ${allFacilities.length}개 시설 로드 완료\n`);

    // Group by name
    const nameMap: Record<string, Facility[]> = {};
    allFacilities.forEach(f => {
        const normalizedName = f.name.trim().toLowerCase();
        if (!nameMap[normalizedName]) nameMap[normalizedName] = [];
        nameMap[normalizedName].push(f);
    });

    const duplicates = Object.entries(nameMap)
        .filter(([_, facs]) => facs.length > 1)
        .sort((a, b) => b[1].length - a[1].length);

    console.log(`📊 중복 이름: ${duplicates.length}개\n`);

    // Categories
    const autoMerge: Array<{ keep: Facility, remove: Facility[] }> = [];
    const manualReview: Array<{ name: string, facilities: Facility[] }> = [];

    // Analyze each duplicate group
    duplicates.forEach(([name, facilities]) => {
        // Sort by data quality (public_data > ai, verified > not verified)
        const sorted = facilities.sort((a, b) => {
            if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
            if (a.data_source === 'public_data' && b.data_source !== 'public_data') return -1;
            if (a.data_source !== 'public_data' && b.data_source === 'public_data') return 1;
            return 0;
        });

        // Check if all are at same location
        const firstFacility = sorted[0];
        const sameLocation = sorted.every(f =>
            calculateDistance(f.lat, f.lng, firstFacility.lat, firstFacility.lng) < COORD_THRESHOLD
        );

        // Check if addresses are similar
        const normalizedAddrs = sorted.map(f => normalizeAddress(f.address));
        const sameAddress = normalizedAddrs.every(addr =>
            addr === normalizedAddrs[0] ||
            addr.includes(normalizedAddrs[0]) ||
            normalizedAddrs[0].includes(addr)
        );

        if (sameLocation || sameAddress) {
            // AUTO MERGE: Same location OR same address
            autoMerge.push({
                keep: sorted[0],
                remove: sorted.slice(1)
            });
        } else {
            // MANUAL REVIEW: Different location AND different address
            manualReview.push({
                name: facilities[0].name,
                facilities: sorted
            });
        }
    });

    console.log('='.repeat(100));
    console.log('📊 분류 결과:\n');
    console.log(`✅ 자동 병합: ${autoMerge.length}개 그룹 (${autoMerge.reduce((sum, g) => sum + g.remove.length, 0)}개 레코드 삭제 예정)`);
    console.log(`⚠️ 수동 검토: ${manualReview.length}개 그룹\n`);

    // Execute auto-merge
    let mergedCount = 0;
    let deletedCount = 0;

    if (autoMerge.length > 0) {
        console.log('='.repeat(100));
        console.log('✅ 자동 병합 실행 중...\n');

        for (const group of autoMerge) {
            console.log(`📍 ${group.keep.name}`);
            console.log(`   유지: ID ${group.keep.id} (${group.keep.data_source})`);
            console.log(`   삭제: ${group.remove.length}개`);

            if (!DRY_RUN) {
                // Delete duplicates
                const idsToDelete = group.remove.map(f => f.id);
                const { error } = await supabase
                    .from('memorial_spaces')
                    .delete()
                    .in('id', idsToDelete);

                if (error) {
                    console.error(`   ❌ 삭제 실패: ${error.message}`);
                } else {
                    deletedCount += idsToDelete.length;
                    mergedCount++;
                    console.log(`   ✅ 삭제 완료`);
                }
            } else {
                deletedCount += group.remove.length;
                mergedCount++;
            }
        }
    }

    // Generate manual review CSV
    if (manualReview.length > 0) {
        console.log('\n' + '='.repeat(100));
        console.log('⚠️ 수동 검토 필요 항목 (CSV 생성 중)...\n');

        const csvLines = ['이름,개수,ID1,주소1,좌표1,ID2,주소2,좌표2,비고'];

        manualReview.forEach(group => {
            const facs = group.facilities;
            const row = [
                `"${group.name}"`,
                facs.length,
                facs[0].id,
                `"${facs[0].address}"`,
                `"${facs[0].lat},${facs[0].lng}"`,
                facs[1]?.id || '',
                `"${facs[1]?.address || ''}"`,
                `"${facs[1] ? facs[1].lat + ',' + facs[1].lng : ''}"`,
                facs.length > 2 ? `외 ${facs.length - 2}개` : ''
            ];
            csvLines.push(row.join(','));
        });

        const csvPath = path.resolve(process.cwd(), 'manual_review_duplicates.csv');
        fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
        console.log(`✅ CSV 생성 완료: ${csvPath}\n`);
    }

    // Summary
    console.log('='.repeat(100));
    console.log('\n📊 최종 결과:\n');
    console.log(`원본 시설 수: ${allFacilities.length}개`);
    console.log(`자동 병합: ${mergedCount}개 그룹`);
    console.log(`삭제된 레코드: ${deletedCount}개`);
    console.log(`수동 검토 필요: ${manualReview.length}개 그룹`);
    console.log(`예상 최종 시설 수: ${allFacilities.length - deletedCount}개\n`);

    if (DRY_RUN) {
        console.log('⚠️ DRY RUN 모드: 실제 삭제는 수행되지 않았습니다.');
        console.log('실제 실행하려면 스크립트의 DRY_RUN을 false로 변경하세요.\n');
    }
}

hybridDeduplication();
