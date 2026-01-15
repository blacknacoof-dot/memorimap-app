
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!; // Use service role for full access

if (!supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY. Cannot perform full backup.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            if (val === null || val === undefined) {
                return '';
            }
            const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
            // Escape quotes and wrap in quotes
            return `"${stringVal.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

async function exportAllTables() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(process.cwd(), `backups/backup_${timestamp}`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`📂 Starting Backup to: ${backupDir}`);

    // 1. Get List of Tables
    // Note: RLS might hide tables if not using service key, but we are.
    // We can query information_schema or just a known list. 
    // Let's try to query all table names first using a raw query if possible, 
    // or use a predefined list based on the project.
    // Since we don't have direct raw query access in JS client without RPC, 
    // lets use the known list from the screenshot + typical ones.

    const tables = [
        'memorial_spaces',
        'facilities', // UUID based one
        'facility_admins',
        'facility_images',
        'facility_reviews',
        'facility_subscriptions',
        'facility_submissions',
        'ai_consultations',
        'bot_data',
        'consultations',
        'memorial_consultations',
        'leads',
        'favorites',
        'funeral_companies',
        'funeral_progress',
        'sangjo_contracts',
        'notices',
        'notification_logs',
        'profiles', // If exists
        'partner_inquiries',
        'reservations', // If exists
        'faq_view_logs'
    ];

    console.log(`📋 Target Tables: ${tables.length} tables to attempt.`);

    for (const tableName of tables) {
        try {
            console.log(`⏳ Exporting ${tableName}...`);

            const { data, error } = await supabase
                .from(tableName)
                .select('*');

            if (error) {
                // If table doesn't exist, it will error. Just log and continue.
                // PostgREST error code 42P01 is undefined_table
                if (error.code === '42P01') {
                    console.log(`   Detailed info: Table ${tableName} does not exist. Skipping.`);
                } else {
                    console.warn(`   ⚠️ Status: Error fetching ${tableName}: ${error.message} (Code: ${error.code})`);
                }
                continue;
            }

            if (!data || data.length === 0) {
                console.log(`   ℹ️  Status: ${tableName} is empty.`);
                // Create empty CSV
                fs.writeFileSync(path.join(backupDir, `${tableName}.csv`), '');
            } else {
                const csv = convertToCSV(data);
                fs.writeFileSync(path.join(backupDir, `${tableName}.csv`), csv);
                console.log(`   ✅ Status: Saved ${data.length} rows.`);
            }

        } catch (err: any) {
            console.error(`   ❌ Unexpected error for ${tableName}:`, err.message);
        }
    }

    console.log(`\n🎉 Backup Complete! Files saved in ${backupDir}`);
}

exportAllTables();
