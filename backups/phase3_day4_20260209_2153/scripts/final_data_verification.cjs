const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function verifyData() {
    console.log("📊 Final Data Verification Report\n");

    // 1. Stats (Total vs Valid vs Missing)
    const { count: total } = await supabase.from('memorial_spaces').select('*', { count: 'exact', head: true });

    // Valid Coords (lat/lng not null)
    const { count: valid } = await supabase.from('memorial_spaces')
        .select('*', { count: 'exact', head: true })
        .not('lat', 'is', null)
        .not('lng', 'is', null);

    const missing = total - valid;

    console.log(`1. 데이터 현황`);
    console.log(`   - 전체 시설 수: ${total}`);
    console.log(`   - 📍 좌표 있음 (정상): ${valid} (${((valid / total) * 100).toFixed(1)}%)`);
    console.log(`   - ❌ 좌표 없음 (데이터 빔): ${missing} (${((missing / total) * 100).toFixed(1)}%)\n`);

    // 2. Missing List
    if (missing > 0) {
        const { data: missingList } = await supabase
            .from('memorial_spaces')
            .select('name, address, phone')
            .or('lat.is.null,lng.is.null');

        console.log(`2. 좌표 없는 시설 리스트 (총 ${missingList.length}건)`);
        missingList.forEach(item => {
            console.log(`   - ${item.name} | 주소: ${item.address || '(없음)'}`);
        });
        console.log('');
    } else {
        console.log(`2. 좌표 없는 시설 리스트: 없음 (완벽함!)\n`);
    }

    // 3. Outliers (Outside Korea: Lat 33~39, Lng 124~132)
    // Fetch all valid ones and filter in JS for flexibility
    const { data: allValid } = await supabase
        .from('memorial_spaces')
        .select('name, address, lat, lng')
        .not('lat', 'is', null);

    const outliers = allValid.filter(item =>
        item.lat < 33 || item.lat > 39 || item.lng < 124 || item.lng > 132
    );

    if (outliers.length > 0) {
        console.log(`3. 🚩 위치 이상 데이터 (Outliers) - ${outliers.length}건`);
        outliers.forEach(item => {
            console.log(`   - ${item.name}: (${item.lat}, ${item.lng}) - ${item.address}`);
        });
    } else {
        console.log(`3. 🚩 위치 이상 데이터: 없음 (모두 국내 좌표)\n`);
    }

    // 4. Bad Address (Length < 5 or Null)
    // We already have counts, let's just query or filter
    const badAddresses = (await supabase.from('memorial_spaces').select('name, address')).data
        .filter(item => !item.address || item.address.length < 5);

    if (badAddresses.length > 0) {
        console.log(`4. ⚠️ 주소 데이터 퀄리티 미흡 - ${badAddresses.length}건`);
        badAddresses.forEach(item => {
            console.log(`   - ${item.name}: '${item.address}'`);
        });
    } else {
        console.log(`4. ⚠️ 주소 데이터 퀄리티: 양호 (모두 5자 이상)\n`);
    }

    console.log("--------------------------------------------------");
}

verifyData();
