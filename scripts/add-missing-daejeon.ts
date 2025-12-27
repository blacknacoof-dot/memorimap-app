import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingFacilities() {
    console.log('=== 미등록 시설 추가 ===\n');

    // source 컬럼 없이 기본 필드만 사용
    const newFacilities = [
        {
            name: '유성한가족병원 장례식장',
            type: 'funeral',
            address: '대전광역시 유성구 온천동로 43 (봉명동)',
            phone: '042-611-9700',
            lat: 36.3525,
            lng: 127.3470,
            description: '유성구에 위치한 병원 장례식장으로, 24시간 운영되며 편리한 시설을 갖추고 있습니다.',
            image_url: 'https://15774129.go.kr/BCUser/facilitypic/1434526212645_7000001073_0.jpg'
        },
        {
            name: '시민장례식장',
            type: 'funeral',
            address: '대전광역시 중구 보문산로 359, 별관 (문화동)',
            phone: '042-253-4801',
            lat: 36.3080,
            lng: 127.4280,
            description: '대전 중구에 위치한 장례식장으로, 보문산 인근의 조용한 환경에서 장례를 치를 수 있습니다.',
            image_url: 'https://15774129.go.kr/BCUser/facilitypic/7000002196/1709686250384.PNG'
        }
    ];

    for (const facility of newFacilities) {
        // 중복 체크 - 더 정확한 매칭
        const { data: existing } = await supabase
            .from('memorial_spaces')
            .select('id, name, address')
            .or(`name.ilike.%${facility.name}%,address.ilike.%${facility.address.split(' ')[1]}%`)
            .limit(5);

        // 대전 주소인 것만 필터
        const daejeonExisting = (existing || []).filter(e =>
            e.address?.includes('대전') &&
            (e.name?.includes(facility.name.split(' ')[0]) || facility.name.includes(e.name?.split(' ')[0] || ''))
        );

        if (daejeonExisting.length > 0) {
            console.log(`⚠️ ${facility.name}: 유사한 시설이 이미 등록됨`);
            for (const e of daejeonExisting) {
                console.log(`   - ${e.name} (${e.address})`);
            }
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

async function fixNajinFacility() {
    console.log('\n=== 나진장례식장 보완 ===\n');

    // 나진장례식장 조회
    const { data: najin, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .ilike('name', '%나진장례식장%')
        .single();

    if (error || !najin) {
        console.log('❌ 나진장례식장을 찾을 수 없음');
        return;
    }

    console.log(`📍 나진장례식장 (ID: ${najin.id})`);
    console.log(`   현재 소개: ${najin.description || '없음'}`);
    console.log(`   현재 갤러리: ${najin.gallery_images?.length || 0}개`);

    // 업데이트
    const { error: updateError } = await supabase
        .from('memorial_spaces')
        .update({
            description: '대전 서구 괴정동에 위치한 장례식장으로, 정성스러운 장례 서비스를 제공합니다.',
            image_url: 'https://15774129.go.kr/BCUser/facilitypic/7000000168/1554339118560.png'
        })
        .eq('id', najin.id);

    if (updateError) {
        console.error(`❌ 업데이트 실패: ${updateError.message}`);
    } else {
        console.log('✅ 나진장례식장 보완 완료');
    }
}

async function main() {
    await addMissingFacilities();
    await fixNajinFacility();

    console.log('\n🎉 모든 작업 완료!');
}

main().catch(console.error);
