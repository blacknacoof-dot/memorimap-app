import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(rootDir, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backupSangjoData() {
    console.log('📦 상조 데이터 백업 시작...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(rootDir, 'data', 'backups');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    // 1. 삭제 대상 Facilities 조회
    const { data: facilities, error: facError } = await supabase
        .from('facilities')
        .select('*')
        .or('category.eq.sangjo,name.ilike.%상조%,name.ilike.%서비스%');

    if (facError) throw facError;
    console.log(`   - Facilities found: ${facilities.length}`);

    const facilityIds = facilities.map(f => f.id);
    if (facilityIds.length === 0) {
        console.log('⚠️ 백업할 상조 데이터가 없습니다.');
        return;
    }

    // 2. 연관 데이터 조회

    // Reviews
    const { data: reviews, error: revError } = await supabase
        .from('facility_reviews') // Assuming table name
        .select('*')
        .in('facility_id', facilityIds);
    if (revError && revError.code !== '42P01') console.error('Error fetching reviews:', revError.message);
    else console.log(`   - Reviews found: ${reviews?.length || 0}`);

    // Images
    const { data: images, error: imgError } = await supabase
        .from('facility_images')
        .select('*')
        .in('facility_id', facilityIds);
    if (imgError && imgError.code !== '42P01') console.error('Error fetching images:', imgError.message);
    else console.log(`   - Images found: ${images?.length || 0}`);

    // Favorites (구버전)
    const { data: favorites, error: favError } = await supabase
        .from('favorites')
        .select('*')
        .in('facility_id', facilityIds);
    if (favError && favError.code !== '42P01') console.error('Error fetching favorites:', favError.message);
    else console.log(`   - Favorites found: ${favorites?.length || 0}`);

    // 3. 파일 저장
    const backupData = {
        metadata: {
            timestamp,
            total_facilities: facilities.length,
            criteria: "category='sangjo' OR name ILIKE '%상조%' OR name ILIKE '%서비스%'"
        },
        facilities,
        reviews: reviews || [],
        images: images || [],
        favorites: favorites || []
    };

    const filePath = path.join(backupDir, `sangjo_backup_${timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    console.log(`✅ 백업 완료!`);
    console.log(`   - 경로: ${filePath}`);
    console.log(`   - 크기: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB`);
}

backupSangjoData().catch(err => {
    console.error('❌ 백업 실패:', err);
    process.exit(1);
});
