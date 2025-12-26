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

const DRY_RUN = false; // Set to false to actually delete

async function backupAndDeletePublicData() {
    console.log('🔄 Public Data 백업 및 삭제 시작...\n');
    console.log(`모드: ${DRY_RUN ? 'DRY RUN (실제 삭제 안함)' : 'LIVE (실제 삭제)'}\n`);

    // Fetch all public_data facilities
    let publicData: any[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('*')
            .eq('data_source', 'public_data')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('❌ 조회 오류:', error);
            return;
        }

        if (!data || data.length === 0) break;

        publicData = publicData.concat(data);
        page++;

        if (data.length < pageSize) break;
    }

    console.log(`📋 총 ${publicData.length}개 public_data 시설 발견\n`);

    if (publicData.length === 0) {
        console.log('✅ 삭제할 public_data 없음');
        return;
    }

    // Backup to CSV
    console.log('💾 CSV 백업 생성 중...\n');

    const headers = Object.keys(publicData[0]);
    const csvLines = [headers.join(',')];

    publicData.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            // Escape quotes and wrap in quotes if contains comma
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        });
        csvLines.push(values.join(','));
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const csvPath = path.resolve(process.cwd(), `public_data_backup_${timestamp}.csv`);
    fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');

    console.log(`✅ 백업 완료: ${csvPath}\n`);

    // Delete public_data
    if (!DRY_RUN) {
        console.log('🗑️ Public Data 삭제 중...\n');

        const { error } = await supabase
            .from('memorial_spaces')
            .delete()
            .eq('data_source', 'public_data');

        if (error) {
            console.error(`❌ 삭제 실패: ${error.message}`);
        } else {
            console.log(`✅ 삭제 완료: ${publicData.length}개\n`);
        }
    }

    // Check remaining data
    const { count } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true });

    console.log('='.repeat(100));
    console.log('\n📊 최종 결과:\n');
    console.log(`백업된 public_data: ${publicData.length}개`);
    console.log(`현재 전체 시설 수: ${count}개`);

    if (DRY_RUN) {
        console.log(`삭제 후 예상 시설 수: ${(count || 0) - publicData.length}개\n`);
        console.log('⚠️ DRY RUN 모드: 실제 삭제는 수행되지 않았습니다.');
        console.log('실제 실행하려면 스크립트의 DRY_RUN을 false로 변경하세요.\n');
    } else {
        console.log(`\n✅ 완료! 어제 상태(AI 데이터만)로 복구되었습니다.\n`);
    }
}

backupAndDeletePublicData();
