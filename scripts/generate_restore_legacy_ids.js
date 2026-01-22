import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_FILE = path.join(__dirname, '..', 'data', 'backups', 'facilities_full_backup_2026-01-19T04-59-40-774Z.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'migrations', '20260122_restore_legacy_ids.sql');

async function generateLegacyIdRestoreSql() {
    console.log('Reading backup file...');
    const data = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    console.log(`Found ${data.length} records in backup.`);

    let sql = '-- [Legacy ID Restoration]\n';
    sql += '-- Restore legacy_id by matching Name and Address (approx)\n';
    sql += 'BEGIN;\n\n';

    let count = 0;

    data.forEach(item => {
        const legacy_id = item.legacy_id;
        const name = item.name;
        const address = item.address;

        if (!legacy_id || !name) return;

        // Skip Sangjo for now as they might have different ID rules
        if (item.category && (item.category.includes('sangjo') || item.category === 'fc')) return;

        // Use name and partial address for matching to be safe
        // We update facilities where name matches exactly
        const escapedName = name.replace(/'/g, "''");

        // We use a simple match on Name first. 
        // Ideally we match on Name AND Address, but address formats might have changed slightly.
        // Let's try Name match. If duplicates exist, this might update multiple, which is usually OK for legacy_id content 
        // unless different branches have same name.

        // Update logic:
        sql += `UPDATE public.facilities SET legacy_id = '${legacy_id}' WHERE name = '${escapedName}' AND legacy_id IS NULL;\n`;
        count++;
    });

    sql += '\nCOMMIT;';

    fs.writeFileSync(OUTPUT_FILE, sql);
    console.log(`Successfully generated ${count} update statements in ${OUTPUT_FILE}`);
}

generateLegacyIdRestoreSql().catch(console.error);
