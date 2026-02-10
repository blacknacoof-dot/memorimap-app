
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function restoreImages() {
    const dataDir = path.resolve(process.cwd(), 'data');
    const files = fs.readdirSync(dataDir).filter(f => f.startsWith('facilities_') && f.endsWith('.csv'));

    console.log(`Found ${files.length} CSV files to process.`);

    let totalUpdated = 0;
    let totalProcessed = 0;

    for (const file of files) {
        console.log(`Processing ${file}...`);
        const content = fs.readFileSync(path.join(dataDir, file));
        // Decoding: The file seems to be UTF-8 but some chars are broken? Or it is EUC-KR read as UTF-8?
        // Actually the preview showed readable standard chars for URL/Phone.
        // We will trust the ASCII parts.

        // Parse CSV
        // Columns: fac_type,fac_thumb src,fac_tit,fac_addr,fac_tel href,fac_tel,...
        try {
            const records = parse(content, {
                columns: true,
                skip_empty_lines: true,
                relax_quotes: true,
                relax_column_count: true
            });

            for (const record of records) {
                totalProcessed++;
                const imageUrl = record['fac_thumb src'];
                const phone = record['fac_tel'];

                if (!imageUrl || !phone) continue;
                if (imageUrl.includes('img_no_image') || imageUrl.length < 10) continue;

                // Normalize Phone: Remove dashes, spaces
                const normalizedPhone = phone.replace(/[^0-9]/g, '');
                if (normalizedPhone.length < 8) continue;

                // Search in DB
                // We search by phone using 'ilike' %phone% or normalized?
                // DB phone might have dashes.
                // Let's try flexible search.

                const { data: facilities, error } = await supabase
                    .from('facilities')
                    .select('id, images')
                    .or(`phone.eq.${phone},phone.eq.${normalizedPhone},phone.ilike.%${phone}%`)
                    .limit(1);

                if (facilities && facilities.length > 0) {
                    const facility = facilities[0];

                    // Update images if currently placeholder or empty
                    // We overwrite with the restored image as primary
                    const newImages = [imageUrl];

                    const { error: updateError } = await supabase
                        .from('facilities')
                        .update({
                            images: newImages,
                            // backup original url if needed? no column for it.
                        })
                        .eq('id', facility.id);

                    if (!updateError) {
                        process.stdout.write('.');
                        totalUpdated++;
                    } else {
                        console.error(`Failed update ID ${facility.id}:`, updateError.message);
                    }
                }
            }
        } catch (err) {
            console.error(`Error parsing ${file}:`, err);
        }
    }

    console.log(`\n\nDone! Processed ${totalProcessed} records. Updated ${totalUpdated} facilities.`);
}

restoreImages();
