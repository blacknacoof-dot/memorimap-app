
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

async function bulkUpload() {
    console.log("🚀 Bulk Uploading Price Info...");

    if (!fs.existsSync('full_price_update.json')) {
        console.error("❌ full_price_update.json not found.");
        return;
    }

    const raw = fs.readFileSync('full_price_update.json', 'utf-8');
    const matches = JSON.parse(raw);

    console.log(`📦 updating ${matches.length} facilities...`);

    const BATCH_SIZE = 50;

    for (let i = 0; i < matches.length; i += BATCH_SIZE) {
        const batch = matches.slice(i, i + BATCH_SIZE);

        // Parallel update requests? Or sequential to avoid rate limits?
        // Supabase REST fits well with Promise.all but keep size reasonable.

        await Promise.all(batch.map(async (item: any) => {
            const priceInfo = {
                updated_at: new Date().toISOString(),
                source: '2023_public_data_matched',
                items: item.prices
            };

            const { error } = await supabase
                .from('memorial_spaces')
                .update({
                    price_info: priceInfo,
                    // Optional: set verified if we trust this data source significantly
                    // is_verified: true 
                })
                .eq('id', item.id);

            if (error) console.error(`Failed ${item.name}: ${error.message}`);
        }));

        console.log(`✅ Processed ${Math.min(i + BATCH_SIZE, matches.length)} / ${matches.length}`);
    }

    console.log(`\n✨ Update Complete!`);
}

bulkUpload();
