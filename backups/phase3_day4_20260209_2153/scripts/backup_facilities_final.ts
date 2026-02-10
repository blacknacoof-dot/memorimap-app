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
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function backup() {
    console.log('💾 전체 시설 데이터 백업 중...');

    // 1. Facilities 조회
    const { data: facilities, error } = await supabase
        .from('facilities')
        .select('*');

    if (error) {
        console.error('❌ 백업 실패:', error);
        return;
    }

    // 2. 파일 저장
    const backupDir = path.resolve(rootDir, 'data/backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `facilities_full_backup_${timestamp}.json`;
    const filePath = path.join(backupDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(facilities, null, 2), 'utf-8');

    console.log(`✅ 백업 완료: ${filePath}`);
    console.log(`   총 ${facilities.length}개 시설 저장됨.`);
}

backup();
