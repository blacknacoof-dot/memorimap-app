import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 설정 누락');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = true; // Set to false to actually update/delete

interface Facility {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    type: string;
    image_url: string;
    data_source: string;
}

function normalizeAddress(addr: string): string {
    return addr
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[()]/g, '')
        .replace(/특별시|광역시|특별자치시|특별자치도/g, '');
}

async function mergeImages() {
    console.log('🔄 이미지 병합 시작...\n');
    console.log(`모드: ${DRY_RUN ? 'DRY RUN (실제 업데이트/삭제 안함)' : 'LIVE (실제 업데이트/삭제)'}\n`);

    // Fetch all facilities
    let allFacilities: Facility[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, lat, lng, type, image_url, data_source')
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

    // Separate by data source
    const aiData = allFacilities.filter(f => f.data_source === 'ai');
    const publicData = allFacilities.filter(f => f.data_source === 'public_data');

    console.log(`📊 데이터 분포:`);
    console.log(`- AI (네이버): ${aiData.length}개`);
    console.log(`- Public Data: ${publicData.length}개\n`);

    // Find matches
    let updatedCount = 0;
    let deletedCount = 0;
    const toDelete: string[] = [];

    console.log('='.repeat(100));
    console.log('🔍 매칭 중...\n');

    for (const pubFacility of publicData) {
        const normalizedPubName = pubFacility.name.trim().toLowerCase();
        const normalizedPubAddr = normalizeAddress(pubFacility.address);

        // Find matching AI facility
        const match = aiData.find(ai => {
            const normalizedAiName = ai.name.trim().toLowerCase();
            const normalizedAiAddr = normalizeAddress(ai.address);

            return normalizedAiName === normalizedPubName &&
                (normalizedAiAddr === normalizedPubAddr ||
                    normalizedAiAddr.includes(normalizedPubAddr) ||
                    normalizedPubAddr.includes(normalizedAiAddr));
        });

        if (match) {
            console.log(`✅ 매칭: ${pubFacility.name}`);
            console.log(`   AI ID: ${match.id}`);
            console.log(`   Public ID: ${pubFacility.id}`);

            // Check if public_data has image and AI doesn't
            const pubHasImage = pubFacility.image_url && pubFacility.image_url.trim() !== '';
            const aiHasImage = match.image_url && match.image_url.trim() !== '';

            if (pubHasImage && !aiHasImage) {
                console.log(`   📷 이미지 업데이트: AI에 이미지 없음 → Public 이미지 복사`);

                if (!DRY_RUN) {
                    const { error } = await supabase
                        .from('memorial_spaces')
                        .update({ image_url: pubFacility.image_url })
                        .eq('id', match.id);

                    if (error) {
                        console.error(`   ❌ 업데이트 실패: ${error.message}`);
                    } else {
                        updatedCount++;
                    }
                } else {
                    updatedCount++;
                }
            } else if (pubHasImage && aiHasImage) {
                console.log(`   ℹ️ 양쪽 모두 이미지 있음 (AI 이미지 유지)`);
            } else if (!pubHasImage) {
                console.log(`   ℹ️ Public에 이미지 없음`);
            }

            // Mark for deletion
            toDelete.push(pubFacility.id);
            deletedCount++;
            console.log(`   🗑️ Public 데이터 삭제 예정`);
            console.log('');
        }
    }

    // Delete public_data duplicates
    if (toDelete.length > 0 && !DRY_RUN) {
        console.log('='.repeat(100));
        console.log(`\n🗑️ Public 데이터 삭제 중... (${toDelete.length}개)\n`);

        // Delete in batches of 100
        for (let i = 0; i < toDelete.length; i += 100) {
            const batch = toDelete.slice(i, i + 100);
            const { error } = await supabase
                .from('memorial_spaces')
                .delete()
                .in('id', batch);

            if (error) {
                console.error(`❌ 삭제 실패 (배치 ${Math.floor(i / 100) + 1}): ${error.message}`);
            } else {
                console.log(`✅ 삭제 완료: ${batch.length}개`);
            }
        }
    }

    // Summary
    console.log('='.repeat(100));
    console.log('\n📊 최종 결과:\n');
    console.log(`원본 시설 수: ${allFacilities.length}개`);
    console.log(`매칭된 중복: ${deletedCount}개`);
    console.log(`이미지 업데이트: ${updatedCount}개`);
    console.log(`삭제 예정: ${deletedCount}개`);
    console.log(`예상 최종 시설 수: ${allFacilities.length - deletedCount}개\n`);

    if (DRY_RUN) {
        console.log('⚠️ DRY RUN 모드: 실제 업데이트/삭제는 수행되지 않았습니다.');
        console.log('실제 실행하려면 스크립트의 DRY_RUN을 false로 변경하세요.\n');
    }
}

mergeImages();
