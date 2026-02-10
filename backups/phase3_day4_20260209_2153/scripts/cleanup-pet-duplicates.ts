
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
    console.log('🧹 cleaning up Pet Facility Duplicates...');

    // Fetch all pet facilities
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .eq('type', 'pet');

    if (error) {
        console.error('Error fetching facilities:', error);
        return;
    }

    // Group by coordinates
    const clusters: Record<string, typeof facilities> = {};
    facilities.forEach(f => {
        const key = `${f.lat},${f.lng}`;
        if (!clusters[key]) clusters[key] = [];
        clusters[key].push(f);
    });

    const idsToDelete: string[] = [];

    Object.entries(clusters).forEach(([key, group]) => {
        if (group.length > 1) {
            console.log(`\nProcessing Cluster at [${key}] (${group.length} items)`);

            // Sort: Prioritize items with 'image_url' and longer ID (Naver ID)
            // We want to KEEP the best one.
            const protectedItem = group.reduce((prev, current) => {
                const prevScore = (prev.image_url ? 2 : 0) + (prev.id.length > 5 ? 1 : 0);
                const currScore = (current.image_url ? 2 : 0) + (current.id.length > 5 ? 1 : 0);
                return currScore > prevScore ? current : prev;
            });

            console.log(`   ✅ KEEP: ${protectedItem.id}: ${protectedItem.name} (Has Image: ${!!protectedItem.image_url})`);

            group.forEach(f => {
                if (f.id !== protectedItem.id) {
                    console.log(`   ❌ DELETE: ${f.id}: ${f.name} (Has Image: ${!!f.image_url})`);
                    idsToDelete.push(f.id);
                }
            });
        }
    });

    console.log(`\nFound ${idsToDelete.length} duplicates to delete.`);

    if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
            .from('memorial_spaces')
            .delete()
            .in('id', idsToDelete);

        if (deleteError) {
            console.error('Error deleting duplicates:', deleteError);
        } else {
            console.log('✅ Successfully deleted duplicates.');
        }
    }
}

cleanupDuplicates();
