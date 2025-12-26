
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function uploadFuzzyMatches() {
    console.log("🚀 Uploading Fuzzy Matches...");

    if (!fs.existsSync('fuzzy_matches.json')) {
        console.error("❌ fuzzy_matches.json not found.");
        return;
    }

    const raw = fs.readFileSync('fuzzy_matches.json', 'utf-8');
    const matches = JSON.parse(raw);

    console.log(`📦 updating ${matches.length} facilities...`);

    const BATCH_SIZE = 50;
    let successCount = 0;

    for (let i = 0; i < matches.length; i += BATCH_SIZE) {
        const batch = matches.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (item: any) => {
            const priceInfo = {
                updated_at: new Date().toISOString(),
                source: '2023_public_data_fuzzy',
                original_csv_name: item.csvName,
                items: item.prices
            };

            // Only update if not already verified? Or force update?
            // Force update is better to fill data.
            const { error } = await supabase
                .from('memorial_spaces')
                .update({
                    price_info: priceInfo
                })
                .eq('id', item.id);

            if (error) {
                console.error(`Failed ${item.dbName}: ${error.message}`);
            } else {
                successCount++;
            }
        }));

        console.log(`✅ Processed ${Math.min(i + BATCH_SIZE, matches.length)} / ${matches.length}`);
    }

    console.log(`\n✨ Upload Complete! Success: ${successCount}`);
}

uploadFuzzyMatches();
