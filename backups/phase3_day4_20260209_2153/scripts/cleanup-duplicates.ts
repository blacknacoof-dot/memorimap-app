
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

interface Facility {
    id: number;
    name: string;
    address: string;
    type: string;
    lat: number;
    lng: number;
    parent_id?: number | null;
    is_verified: boolean;
    data_source: string;
    review_count: number;
    image_url: string;
    phone: string;
}

// Levenshtein Distance Implementation
function levenshtein(a: string, b: string): number {
    const matrix = [];
    let i, j;

    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function isSimilarName(name1: string, name2: string): boolean {
    const n1 = name1.replace(/\s+/g, '').toLowerCase();
    const n2 = name2.replace(/\s+/g, '').toLowerCase();

    if (n1 === n2) return true;
    if (n1.includes(n2) || n2.includes(n1)) return true;

    const dist = levenshtein(n1, n2);
    const maxLength = Math.max(n1.length, n2.length);
    const similarity = 1 - dist / maxLength;

    // 60% similarity threshold (relaxed to catch "A Funeral" vs "A Hospital Funeral")
    return similarity > 0.6;
}

function getSourceScore(source: string): number {
    if (!source) return 0;
    const s = source.toLowerCase();
    // Verified sources have highest priority
    if (s.includes('verified')) return 100;
    if (s.includes('partner')) return 90;
    if (s.includes('esky')) return 80; // Trusted external source
    if (s.includes('manual')) return 70;
    if (s.includes('kakao') || s.includes('naver')) return 50;
    if (s.includes('ai') || s.includes('crawling')) return 10;
    return 20;
}

async function cleanupDuplicates() {
    console.log("🔍 Fetching all facilities...");

    let allFacilities: Facility[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error(error);
            break;
        }
        if (!data || data.length === 0) break;
        allFacilities = allFacilities.concat(data);
        if (data.length < pageSize) break;
        page++;
    }

    console.log(`Fetched ${allFacilities.length} facilities.`);

    const coordMap = new Map<string, Facility[]>();

    // Group by coordinates (6 decimal places approx 11cm precision, but reliable for digital duplicates)
    allFacilities.forEach(f => {
        if (!f.lat || !f.lng) return;
        const key = `${Number(f.lat).toFixed(6)},${Number(f.lng).toFixed(6)}`;
        if (!coordMap.has(key)) coordMap.set(key, []);
        coordMap.get(key)?.push(f);
    });

    let mergeCount = 0;

    // First pass to count clusters
    for (const [key, list] of coordMap.entries()) {
        if (list.length < 2) continue;

        const processed = new Set<number>();

        for (let i = 0; i < list.length; i++) {
            if (processed.has(list[i].id)) continue;

            const group: Facility[] = [list[i]];
            processed.add(list[i].id);

            for (let j = i + 1; j < list.length; j++) {
                if (processed.has(list[j].id)) continue;

                if (isSimilarName(list[i].name, list[j].name)) {
                    group.push(list[j]);
                    processed.add(list[j].id);
                }
            }

            if (group.length < 2) continue;
            mergeCount++;
        }
    }

    console.log(`\n🚀 Starting execution for ${mergeCount} clusters...`);

    for (const [key, list] of coordMap.entries()) {
        if (list.length < 2) continue;

        const processed = new Set<number>();

        for (let i = 0; i < list.length; i++) {
            if (processed.has(list[i].id)) continue;

            const group: Facility[] = [list[i]];
            processed.add(list[i].id);

            for (let j = i + 1; j < list.length; j++) {
                if (processed.has(list[j].id)) continue;

                if (isSimilarName(list[i].name, list[j].name)) {
                    group.push(list[j]);
                    processed.add(list[j].id);
                }
            }

            if (group.length < 2) continue;

            // Decide Winner
            group.sort((a, b) => {
                if (a.is_verified !== b.is_verified) return (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0);
                const sA = getSourceScore(a.data_source);
                const sB = getSourceScore(b.data_source);
                if (sA !== sB) return sB - sA;
                if (!!b.image_url !== !!a.image_url) return (b.image_url ? 1 : 0) - (a.image_url ? 1 : 0);
                if ((b.review_count || 0) !== (a.review_count || 0)) return (b.review_count || 0) - (a.review_count || 0);
                return a.id - b.id;
            });

            const winner = group[0];
            const losers = group.slice(1);

            console.log(`\n🔹 Processing Cluster at ${key} (Winner: [${winner.id}] ${winner.name})`);

            for (const loser of losers) {
                console.log(`   Start merging Loser: [${loser.id}] ${loser.name} -> Winner: [${winner.id}]`);

                // 1. Move Reviews
                const { error: reviewError } = await supabase
                    .from('facility_reviews')
                    .update({ facility_id: winner.id })
                    .eq('facility_id', loser.id);
                if (reviewError) console.error(`    ❌ Failed to move reviews: ${reviewError.message}`);

                // 2. Move Images
                const { error: imageError } = await supabase
                    .from('facility_images')
                    .update({ facility_id: winner.id })
                    .eq('facility_id', loser.id);
                if (imageError) console.error(`    ❌ Failed to move images: ${imageError.message}`);

                // 3. Move Hierarchy (Children)
                const { error: childError } = await supabase
                    .from('memorial_spaces')
                    .update({ parent_id: winner.id })
                    .eq('parent_id', loser.id);
                if (childError) console.error(`    ❌ Failed to move children: ${childError.message}`);

                // 4. Delete Loser
                const { error: delError } = await supabase
                    .from('memorial_spaces')
                    .delete()
                    .eq('id', loser.id);

                if (delError) {
                    console.error(`    ❌ Delete failed: ${delError.message}`);
                } else {
                    console.log(`    ✅ Merged & Deleted.`);
                }
            }
        }
    }
    console.log(`\n✨ Cleanup complete.`);
}

cleanupDuplicates();
