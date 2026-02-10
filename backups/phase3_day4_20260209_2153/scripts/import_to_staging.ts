
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Paths
const BACKUP_DIR = path.resolve(process.cwd(), 'backups'); // Need to find latest backup
const FUNERAL_DIR = path.resolve(process.cwd(), '장례식장');

async function importToStaging() {
    console.log('🚀 Starting Import to Staging Table...');

    // 1. Find latest Memorial Spaces Backup
    const backupFolders = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup_')).sort().reverse();
    if (backupFolders.length === 0) {
        console.error('❌ No backup found!');
        return;
    }
    const latestBackup = path.join(BACKUP_DIR, backupFolders[0], 'memorial_spaces.csv');
    console.log(`📂 Using Backup: ${latestBackup}`);

    await processFile(latestBackup, 'backup', {
        name: ['name', '시설명'],
        address: ['address', '주소'],
        category: ['category', '시설분류'],
        phone: ['tel', 'phone', '전화번호']
    });

    // 2. Import Funeral Home CSVs
    const funeralFiles = fs.readdirSync(FUNERAL_DIR).filter(f => f.endsWith('.csv'));
    console.log(`📂 Found ${funeralFiles.length} Funeral Home files.`);

    for (const file of funeralFiles) {
        await processFile(path.join(FUNERAL_DIR, file), 'new_import', {
            name: ['시설명', '업체명', '장례식장명'],
            address: ['주소', '소재지', '도로명주소'],
            category: [], // Default to '장례식장'
            phone: ['전화번호', '연락처']
        });
    }

    console.log('🎉 All Imports Completed!');
}

async function processFile(filePath: string, type: string, mapping: any) {
    const filename = path.basename(filePath);
    console.log(`   Processing ${filename}...`);

    const content = fs.readFileSync(filePath, 'utf8');
    const { data } = Papa.parse(content, { header: true, skipEmptyLines: true });

    const batchSize = 100;
    let batch = [];

    for (const row of data as any[]) {
        // Map fields
        const name = findValue(row, mapping.name);
        const address = findValue(row, mapping.address);
        const phone = findValue(row, mapping.phone);
        let category = findValue(row, mapping.category);

        if (!category && type === 'new_import') category = '장례식장';

        if (!name) continue; // Skip invalid rows

        batch.push({
            source_file: filename,
            name: name,
            address: address,
            category: category,
            phone: phone,
            raw_data: row
        });

        if (batch.length >= batchSize) {
            await insertBatch(batch);
            batch = [];
        }
    }

    if (batch.length > 0) await insertBatch(batch);
}

function findValue(row: any, keys: string[]) {
    for (const key of keys) {
        if (row[key]) return row[key];
    }
    return null;
}

async function insertBatch(rows: any[]) {
    const { error } = await supabase.from('facilities_staging').insert(rows);
    if (error) console.error('Error inserting batch:', error.message);
}

importToStaging();
