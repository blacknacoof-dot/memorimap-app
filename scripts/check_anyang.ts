import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function checkAnyang() {
    console.log("🔍 '안양' 관련 시설 검색 중...");

    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, lat, lng, type')
        .ilike('address', '%안양%');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`총 ${data.length}개 시설 발견`);

    // Group by coordinates to find exact duplicates
    const coordGroups: Record<string, typeof data> = {};
    const nameGroups: Record<string, typeof data> = {};

    data.forEach(f => {
        const coordKey = `${f.lat},${f.lng}`;
        if (!coordGroups[coordKey]) coordGroups[coordKey] = [];
        coordGroups[coordKey].push(f);

        const nameKey = f.name;
        if (!nameGroups[nameKey]) nameGroups[nameKey] = [];
        nameGroups[nameKey].push(f);
    });

    console.log("\n📍 좌표 중복 확인:");
    Object.entries(coordGroups).forEach(([key, group]) => {
        if (group.length > 1) {
            console.log(`[${key}] 좌표에 ${group.length}개 시설 중복:`);
            group.forEach(f => console.log(`  - ${f.name} (${f.type}) ID: ${f.id}`));
        }
    });

    console.log("\n📛 이름 중복 확인:");
    Object.entries(nameGroups).forEach(([key, group]) => {
        if (group.length > 1) {
            console.log(`[${key}] 이름 ${group.length}개 중복:`);
            group.forEach(f => console.log(`  - ${f.address} (${f.type}) ID: ${f.id}`));
        }
    });
}

checkAnyang();
