import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runBackup() {
    console.log('🚀 Starting Data Backup (v1.7 - 2026-01-07)...');

    let allData: any[] = [];
    let from = 0;
    const step = 1000;

    try {
        while (true) {
            const { data, error } = await supabase
                .from('memorial_spaces')
                .select('*')
                .range(from, from + step - 1)
                .order('id');

            if (error) throw error;
            if (!data || data.length === 0) break;

            allData = allData.concat(data);
            console.log(`Fetched ${allData.length} records...`);

            if (data.length < step) break;
            from += step;
        }

        if (allData.length === 0) {
            console.log('⚠️ No data found in memorial_spaces.');
            return;
        }

        const headers = Object.keys(allData[0]);
        const csvRows = [headers.join(',')];

        for (const row of allData) {
            const values = headers.map(header => {
                const val = row[header];
                if (val === null || val === undefined) return '';
                const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
                // Escape for CSV
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            });
            csvRows.push(values.join(','));
        }

        const fileName = `backup_v1.7_20260107.csv`;
        const filePath = path.join(process.cwd(), fileName);

        // Add BOM for Excel compatibility (Korean characters)
        fs.writeFileSync(filePath, '\uFEFF' + csvRows.join('\n'), 'utf-8');

        console.log(`✅ Backup completed successfully: ${fileName}`);
        console.log(`📊 Total records: ${allData.length}`);

    } catch (err) {
        console.error('❌ Backup failed:', err);
    }
}

runBackup();
