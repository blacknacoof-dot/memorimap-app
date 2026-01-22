import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_FILE = path.join(__dirname, '..', 'data', 'backups', 'facilities_full_backup_2026-01-19T04-59-40-774Z.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'migrations', '20260122_restore_images_v2.sql');

async function generateRestoreSql() {
    console.log('Reading backup file...');
    const data = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    console.log(`Found ${data.length} records in backup.`);

    let sql = '-- [Photo Restoration Plan Phase 1]\n';
    sql += '-- Target: 1,207 Verified Facility Photos\n';
    sql += '-- Excludes: Sangjo companies, placeholders (random/defaults/unsplash/etc)\n\n';
    sql += 'BEGIN;\n\n';

    let count = 0;

    data.forEach(item => {
        const category = item.category || '';
        const name = item.name || '';

        // 1. Skip Sangjo
        if (category.includes('sangjo') || category.includes('fc_') || name.includes('상조')) return;

        const images = item.images || [];
        const image_url = item.image_url || (images.length > 0 ? images[0] : null);
        const legacy_id = item.legacy_id;

        if (!image_url || !legacy_id) return;

        // 2. Strict Placeholder Check (Do not restore these)
        const isPlaceholder = (url) => {
            const bad = [
                'placeholder', 'placehold.it', 'placehold.co',
                'unsplash', 'noimage', 'no-image', 'guitar',
                '_random', '/defaults/', 'via.placeholder'
            ];
            return bad.some(p => url.toLowerCase().includes(p));
        };

        if (isPlaceholder(image_url)) return;

        // 3. Prepare SQL
        const pgArray = `{${images.map(img => `"${img.replace(/"/g, '\\"')}"`).join(',')}}`;
        const escapedImageUrl = image_url.replace(/'/g, "''");

        sql += `UPDATE public.facilities SET image_url = '${escapedImageUrl}', images = '${pgArray}' WHERE legacy_id = '${legacy_id}';\n`;
        count++;
    });

    sql += '\nCOMMIT;';

    fs.writeFileSync(OUTPUT_FILE, sql);
    console.log(`Successfully generated ${count} update statements in ${OUTPUT_FILE}`);
}

generateRestoreSql().catch(console.error);
