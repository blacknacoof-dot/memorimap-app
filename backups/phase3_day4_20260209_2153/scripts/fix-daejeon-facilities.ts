import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Facility {
    id: string;
    name: string;
    image_url: string | null;
    gallery_images: string[] | null;
    address: string;
}

async function fixDaejeonImages() {
    console.log('=== 대전 장례식장 대표이미지 설정 ===\n');

    // 1. 대전 장례식장 중 대표이미지가 없고 갤러리가 있는 시설 조회
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, image_url, gallery_images, address')
        .or('address.ilike.%대전%,address.ilike.%대전광역시%')
        .or('type.eq.funeral,type.eq.funeral_home');

    if (error) {
        console.error('조회 오류:', error.message);
        return;
    }

    // 대전 주소만 필터링
    const daejeonFacilities = (facilities || []).filter((f: Facility) =>
        f.address?.includes('대전')
    );

    console.log(`총 ${daejeonFacilities.length}개 대전 시설 발견\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const facility of daejeonFacilities as Facility[]) {
        // 이미 대표이미지가 있으면 스킵
        if (facility.image_url && facility.image_url.trim() !== '' && !facility.image_url.includes('unsplash')) {
            console.log(`✅ ${facility.name}: 이미 대표이미지 있음`);
            skippedCount++;
            continue;
        }

        // 갤러리 이미지가 있으면 첫 번째를 대표이미지로 설정
        if (facility.gallery_images && facility.gallery_images.length > 0) {
            const firstImage = facility.gallery_images[0];

            const { error: updateError } = await supabase
                .from('memorial_spaces')
                .update({ image_url: firstImage })
                .eq('id', facility.id);

            if (updateError) {
                console.error(`❌ ${facility.name}: 업데이트 실패 - ${updateError.message}`);
            } else {
                console.log(`✅ ${facility.name}: 대표이미지 설정 완료`);
                updatedCount++;
            }
        } else {
            console.log(`⚠️ ${facility.name}: 갤러리 이미지도 없음`);
        }
    }

    console.log(`\n=== 완료 ===`);
    console.log(`업데이트됨: ${updatedCount}개`);
    console.log(`스킵됨: ${skippedCount}개`);
}

async function addMissingFacilities() {
    console.log('\n=== 미등록 시설 추가 ===\n');

    const newFacilities = [
        {
            name: '유성한가족병원 장례식장',
            type: 'funeral',
            address: '대전광역시 유성구 온천동로 43 (봉명동)',
            phone: '042-611-9700',
            lat: 36.3525,
            lng: 127.3470,
            description: '유성구에 위치한 병원 장례식장으로, 24시간 운영되며 편리한 시설을 갖추고 있습니다.',
            image_url: 'https://15774129.go.kr/BCUser/facilitypic/1434526212645_7000001073_0.jpg',
            source: 'public_data'
        },
        {
            name: '시민장례식장',
            type: 'funeral',
            address: '대전광역시 중구 보문산로 359, 별관 (문화동)',
            phone: '042-253-4801',
            lat: 36.3080,
            lng: 127.4280,
            description: '대전 중구에 위치한 장례식장으로, 보문산 인근의 조용한 환경에서 장례를 치를 수 있습니다.',
            image_url: 'https://15774129.go.kr/BCUser/facilitypic/7000002196/1709686250384.PNG',
            source: 'public_data'
        }
    ];

    for (const facility of newFacilities) {
        // 중복 체크
        const { data: existing } = await supabase
            .from('memorial_spaces')
            .select('id, name')
            .ilike('name', `%${facility.name.replace(/\s/g, '%')}%`)
            .limit(1);

        if (existing && existing.length > 0) {
            console.log(`⚠️ ${facility.name}: 이미 등록됨 (${existing[0].name})`);
            continue;
        }

        const { error } = await supabase
            .from('memorial_spaces')
            .insert(facility);

        if (error) {
            console.error(`❌ ${facility.name}: 등록 실패 - ${error.message}`);
        } else {
            console.log(`✅ ${facility.name}: 등록 완료`);
        }
    }
}

async function main() {
    await fixDaejeonImages();
    await addMissingFacilities();

    console.log('\n🎉 모든 작업 완료!');
}

main().catch(console.error);
