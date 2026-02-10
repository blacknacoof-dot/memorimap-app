
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const dataDir = path.resolve(process.cwd(), 'data');
const outFile = path.resolve(process.cwd(), 'scripts/restore_data.sql');

const files = fs.readdirSync(dataDir).filter(f => f.startsWith('facilities_') && f.endsWith('.csv'));

console.log(`Found ${files.length} CSV files.`);

let sql = `
-- Temporary table for bulk updates
CREATE TEMP TABLE temp_updates (
    phone TEXT,
    image_url TEXT,
    name TEXT
);

INSERT INTO temp_updates (phone, image_url, name) VALUES
`;

let values = [];
let count = 0;

for (const file of files) {
    const content = fs.readFileSync(path.join(dataDir, file));
    try {
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            relax_quotes: true,
            relax_column_count: true,
            trim: true
        });

        for (const record of records) {
            let phone = record['fac_tel'];
            let url = record['fac_thumb src'];
            let name = record['fac_tit'];

            if (!phone || !url) continue;
            // Clean up
            url = url.trim();
            phone = phone.trim();
            name = name ? name.trim() : '';

            if (url.includes('img_no_image') || url.length < 10) continue;
            if (phone.length < 8) continue;

            // Escape single quotes
            url = url.replace(/'/g, "''");
            phone = phone.replace(/'/g, "''");
            name = name.replace(/'/g, "''");

            values.push(`('${phone}', '${url}', '${name}')`);
            count++;
        }
    } catch (err) {
        console.error(`Error parsing ${file}:`, err);
    }
}

if (values.length > 0) {
    sql += values.join(',\n') + ';\n\n';

    sql += `
-- 1. Update facilities by Phone
UPDATE public.facilities f
SET images = ARRAY[t.image_url]
FROM temp_updates t
WHERE 
    (f.contact = t.phone OR REPLACE(f.contact, '-', '') = REPLACE(t.phone, '-', ''))
    AND (f.images IS NULL OR f.images = '{}' OR f.images = ARRAY['https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&q=80&w=800']);

-- 2. Update facilities by Name (Secondary Fallback)
-- Matches if name is identical and image is still placeholder
UPDATE public.facilities f
SET images = ARRAY[t.image_url]
FROM temp_updates t
WHERE 
    f.name = t.name
    AND (f.images IS NULL OR f.images = '{}' OR f.images = ARRAY['https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&q=80&w=800']);

-- 3. Insert into facility_images (Phone match)
INSERT INTO public.facility_images (facility_id, image_url, order_index)
SELECT f.id, t.image_url, 0
FROM public.facilities f
JOIN temp_updates t ON (f.contact = t.phone OR REPLACE(f.contact, '-', '') = REPLACE(t.phone, '-', ''))
WHERE NOT EXISTS (
    SELECT 1 FROM public.facility_images fi WHERE fi.facility_id = f.id AND fi.image_url = t.image_url
);

-- 4. Insert into facility_images (Name match)
INSERT INTO public.facility_images (facility_id, image_url, order_index)
SELECT f.id, t.image_url, 0
FROM public.facilities f
JOIN temp_updates t ON f.name = t.name
WHERE NOT EXISTS (
    SELECT 1 FROM public.facility_images fi WHERE fi.facility_id = f.id AND fi.image_url = t.image_url
);

-- Clean up
DROP TABLE temp_updates;
`;

    fs.writeFileSync(outFile, sql);
    console.log(`Generated SQL with ${count} image updates to ${outFile}`);
} else {
    console.log('No valid records found to generate SQL.');
}
