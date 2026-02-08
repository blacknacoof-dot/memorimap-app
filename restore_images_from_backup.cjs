const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function restoreImages() {
    console.log('🚀 [1/2] 백업 데이터(facilities_backup_v4) 가져오는 중...')
    const { data: backups, error: bError } = await supabase
        .from('facilities_backup_v4')
        .select('id, images')

    if (bError) {
        console.error('❌ 백업 데이터 로드 실패:', bError.message)
        return
    }

    console.log(`✅ ${backups.length}개의 백업 데이터를 찾았습니다. 복구를 시작합니다.`)

    let successCount = 0
    let failCount = 0

    // 효율성을 위해 루프를 돌며 업데이트 (ID가 UUID이므로 1:1 매칭)
    for (const item of backups) {
        if (!item.images || item.images.length === 0) continue

        const firstImage = item.images[0]

        const { error: uError } = await supabase
            .from('facilities')
            .update({
                image_url: firstImage,
                images: item.images
            })
            .eq('id', item.id)

        if (uError) {
            failCount++
        } else {
            successCount++
        }

        if ((successCount + failCount) % 50 === 0) {
            console.log(`...진행 중: ${successCount + failCount}/${backups.length}`)
        }
    }

    console.log(`\n✨ 복구 완료!`)
    console.log(`- 성공: ${successCount}`)
    console.log(`- 실패/건너뜀: ${failCount}`)
}

restoreImages()
