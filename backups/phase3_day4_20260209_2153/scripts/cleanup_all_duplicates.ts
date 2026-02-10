
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
    console.log('Fetching all facilities for cleanup...');
    // Fetch ALL fields needed for comparison
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, created_at, image_url, type');

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    console.log(`Total records: ${facilities.length}`);

    // key: "name|address_prefix" -> [facilities]
    const groups = new Map<string, any[]>();

    facilities.forEach(f => {
        if (!f.name || !f.address) return;

        // Normalize logic
        const normName = f.name.replace(/\s+/g, '').toLowerCase();
        // specific logic for address: First 2 words (e.g. "Gyeonggi-do Paju-si")
        const addrParts = f.address.split(' ');
        const normAddr = (addrParts.length >= 2) ? (addrParts[0] + addrParts[1]) : f.address;

        const key = `${normName}|${normAddr}`;

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)?.push(f);
    });

    let deletedCount = 0;

    for (const [key, group] of groups.entries()) {
        if (group.length > 1) {
            console.log(`\nProcessing duplicate group: ${key} (${group.length} records)`);

            // Sort to find the "Best" one to KEEP
            // Criteria 1: Has Image (Prioritize image)
            // Criteria 2: Created At (Prioritize NEWER)
            // Criteria 3: ID (Prioritize Smaller ID? No, stick to Date)

            group.sort((a, b) => {
                const aHasImg = !!a.image_url;
                const bHasImg = !!b.image_url;

                if (aHasImg && !bHasImg) return -1; // a comes first (Keep)
                if (!aHasImg && bHasImg) return 1;  // b comes first

                // Both have images or both don't
                // Prefer NEWER created_at
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return dateB - dateA; // Descending date (Newest first)
            });

            const winner = group[0];
            const losers = group.slice(1);

            console.log(`  Keeping: [${winner.id}] ${winner.name} (${winner.created_at}) Img:${!!winner.image_url}`);

            for (const loser of losers) {
                console.log(`  DELETING: [${loser.id}] ${loser.name} (${loser.created_at}) Img:${!!loser.image_url}`);

                const { error: delError } = await supabase
                    .from('memorial_spaces')
                    .delete()
                    .eq('id', loser.id);

                if (delError) {
                    console.error(`  FAILED to delete ${loser.id}:`, delError);
                } else {
                    deletedCount++;
                }
            }
        }
    }

    console.log(`\nCleanup complete. Total records deleted: ${deletedCount}`);
}

cleanupDuplicates();
