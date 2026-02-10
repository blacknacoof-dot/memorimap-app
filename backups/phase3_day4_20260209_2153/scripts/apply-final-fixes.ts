
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

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
    is_verified: boolean;
    data_source: string;
    parent_id: number | null;
    review_count: number;
    image_url: string;
    phone: string;
}

const DRY_RUN = process.argv.includes('--dry-run');

// Priority Score
function getSourceScore(source: string): number {
    if (!source) return 0;
    if (source.includes('verified')) return 100;
    if (source.includes('esky')) return 80;
    if (source.includes('kakao') || source.includes('naver')) return 50;
    if (source.includes('ai') || source.includes('crawling')) return 10;
    return 20;
}

const REGIONS = [
    '서울', '경기', '인천', '강원', '충북', '충남', '대전', '세종',
    '전북', '전남', '광주', '경북', '경남', '대구', '부산', '울산', '제주',
    // Cities/Counties (Common ones found in duplicates)
    '춘천', '함양', '가평', '삼척', '금산', '음성', '평택', '밀양', '안성', '양산', '거제', '파주', '속초', '김천', '문경', '제천', '전주', '고양', '여수', '경주', '부천', '김포', '정읍', '장흥', '양주', '용인', '이천', '포천', '나주', '부평', '태백', '영천', '동해', '강화', '순창', '칠곡', '청주', '성주', '의령', '창원', '마산', '진해', '김해'
];

// Normalize name for comparison (remove common suffixes/prefixes)
function normalizeName(name: string): string {
    let norm = name
        .replace(/\(주\)/g, '')
        .replace(/\(재\)/g, '')
        .replace(/[\(\)\[\]]/g, '') // Remove all parenthesis chars
        .replace(/장례식장/g, '') // Funeral Home
        .replace(/추모공원/g, '') // Memorial Park
        .replace(/공원묘원/g, '') // Cemetery Park
        .replace(/봉안당/g, '') // Charnel House
        .replace(/납골당/g, '') // Charnel House (Old term)
        .replace(/납골평장/g, '')
        .replace(/납골묘/g, '')
        .replace(/봉안담/g, '') // Outdoor Charnel
        .replace(/봉안탑/g, '')
        .replace(/추모관/g, '') // Memorial Hall
        .replace(/추모의집/g, '')
        .replace(/자연장지/g, '') // Natural Burial Site
        .replace(/자연장/g, '') // Natural Burial
        .replace(/수목장림/g, '')
        .replace(/수목장/g, '') // Tree Burial
        .replace(/잔디장/g, '') // Lawn Burial
        .replace(/묘지/g, '') // Cemetery
        .replace(/공원/g, '') // Park
        .replace(/관리사무소/g, '')
        .replace(/및/g, '')
        .replace(/제[1-9]추모관/g, '')
        // Actually, let's KEEP Numbers to avoid merging Hall 1 and Hall 2.
        // But "Jeongrak Park Je2 Charnel" and "Jeongrak Park Je2" should matches.
        .replace(/\s+/g, '');

    // Remove Region names if they appear at the start (e.g. "Yongin Park" vs "Park")
    // Or just remove them globally since we are matching EXACT Location.
    // "Yongin Park" at 37.123,127.123 vs "Park" at 37.123,127.123 -> Same.
    REGIONS.forEach(r => {
        norm = norm.replace(new RegExp(r, 'g'), '');
    });

    // Remove administrative suffixes left over (e.g. '시', '군') often attached to Region
    norm = norm.replace(/시|군|구/g, '');

    // Also remove common city names if needed, but Regions capture a lot.
    // e.g. "Gwangju Yeongnak" vs "Yeongnak" -> Gwangju is '광주'.

    norm = norm.trim();
    return norm.length > 0 ? norm : name.trim(); // Fallback to original if empty
}

// Check if name is synonymous (ignoring type suffixes)
function isStrictSynonym(nameA: string, nameB: string): boolean {
    const normA = normalizeName(nameA);
    const normB = normalizeName(nameB);
    // Debug log to see why things match or don't
    // console.log(`Comparing: ${nameA} -> ${normA} vs ${nameB} -> ${normB}`);
    return normA === normB && normA.length > 1; // Length > 1 to avoid matching single characters
}

async function applyFinalFixes() {
    console.log(`🔒 Starting Final Cleanup (${DRY_RUN ? 'DRY RUN' : 'EXECUTION'})...\n`);

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .order('id');

    if (error || !facilities) {
        console.error("Failed to fetch:", error);
        return;
    }

    // Group by Exact Location
    const clusterMap = new Map<string, Facility[]>();
    facilities.forEach(f => {
        if (!f.lat || !f.lng) return;
        const key = `${Number(f.lat).toFixed(6)},${Number(f.lng).toFixed(6)}`;
        if (!clusterMap.has(key)) clusterMap.set(key, []);
        clusterMap.get(key)?.push(f);
    });

    let heirarchyCount = 0;
    let mergeCount = 0;

    for (const [key, list] of clusterMap.entries()) {
        if (list.length < 2) continue;

        // --- Logic 1: Hierarchy (Parent - Child) ---
        // Find if there is a 'Park' or 'Complex' that encompasses others
        const parents = list.filter(f => f.type === 'park' || f.type === 'complex');
        const potentialChildren = list.filter(f => ['charnel', 'natural', 'cemetery', 'pet'].includes(f.type) && !f.parent_id);

        // Only valid if we have exactly 1 parent candidate and at least 1 child candidate
        // And check if names are relevant (e.g. child name contains parts of parent name, OR just trust location)
        // Trusting location for Park + Charnel is generally safe in this domain.
        if (parents.length === 1 && potentialChildren.length > 0) {
            const parent = parents[0];

            for (const child of potentialChildren) {
                // Skip if child is verified and has diff owner? (Not impl yet)
                // Skip if child name is totally different? (e.g. distinct business on same land)
                // Heuristic: If Child name length > Parent name length, usually safe (e.g. AA Park -> AA Park Bongandang)
                // If Child name is completely different, log warning but proceed?

                // Explicit check: Do NOT link if types are same (handled by merge)

                console.log(`🔗 Possible Hierarchy at ${key}:`);
                console.log(`   Parent: ${parent.name} (${parent.type})`);
                console.log(`   Child:  ${child.name} (${child.type})`);

                if (!DRY_RUN) {
                    const { error } = await supabase
                        .from('memorial_spaces')
                        .update({ parent_id: parent.id })
                        .eq('id', child.id);

                    if (!error) {
                        console.log(`   ✅ Linked.`);
                        heirarchyCount++;
                    } else {
                        console.error(`   ❌ Link failed:`, error);
                    }
                } else {
                    console.log(`   ✅ [DRY] Would Link.`);
                    heirarchyCount++;
                }
            }
        }

        // --- Logic 2: Strict Merge (Synonyms) ---
        // Filter those who are NOT parent/child of each other (to avoid merging parent into child or vice versa)
        // Actually, we can just look for Same-Type or Compatible-Type (Charnel ~ Charnel) strict name matches.

        // Group by Normalized Name to find Strict Synonyms
        const nameGroups = new Map<string, Facility[]>();

        list.forEach(f => {
            // Safety: Skip Funeral Homes for merge here unless Names are IDENTICAL
            // Funeral homes often share buildings but are distinct.
            if (f.type === 'funeral') {
                // For funeral homes, use strict full name match only
                const key = f.name.replace(/\s+/g, '');
                if (!nameGroups.has(key)) nameGroups.set(key, []);
                nameGroups.get(key)?.push(f);
            } else {
                // For others, use normalized name (removing 'Bongandang' etc)
                const key = normalizeName(f.name);
                console.log(`[DEBUG] ${f.name} -> ${key}`);
                if (key.length < 2) return; // Too short to be safe?
                if (!nameGroups.has(key)) nameGroups.set(key, []);
                nameGroups.get(key)?.push(f);
            }
        });

        for (const [normInfo, subList] of nameGroups.entries()) {
            console.log(`[DEBUG] Group '${normInfo}' has ${subList.length} items.`);
            if (subList.length < 2) continue;

            // Sort by Priority
            subList.sort((a, b) => {
                if (a.is_verified !== b.is_verified) return (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0);
                const sA = getSourceScore(a.data_source);
                const sB = getSourceScore(b.data_source);
                if (sA !== sB) return sB - sA;
                return (b.review_count || 0) - (a.review_count || 0);
            });

            const winner = subList[0];
            const losers = subList.slice(1);

            console.log(`⚔️  Strict Merge Group [${winner.type}] at ${winner.address}`);
            console.log(`   👑 Winner: ${winner.name} (Source: ${winner.data_source})`);

            for (const loser of losers) {
                // Extra Safety: Don't merge if Types are drastically different (e.g. Pet vs Human)
                if (winner.type === 'pet' && loser.type !== 'pet') continue;
                if (winner.type !== 'pet' && loser.type === 'pet') continue;

                console.log(`   🗑️  Loser:  ${loser.name} (Source: ${loser.data_source})`);

                if (!DRY_RUN) {
                    // 1. Merge Data
                    const updates: any = {};
                    if (!winner.phone && loser.phone) updates.phone = loser.phone;
                    if (!winner.image_url && loser.image_url) updates.image_url = loser.image_url;

                    if (Object.keys(updates).length > 0) {
                        await supabase.from('memorial_spaces').update(updates).eq('id', winner.id);
                    }

                    // 2. Move Relations
                    await supabase.from('facility_reviews').update({ facility_id: winner.id }).eq('facility_id', loser.id);
                    await supabase.from('facility_images').update({ facility_id: winner.id }).eq('facility_id', loser.id);

                    // 3. Delete Loser
                    // Handle FK issue: Update children if loser was a parent
                    // If loser has children, move them to winner
                    await supabase.from('memorial_spaces').update({ parent_id: winner.id }).eq('parent_id', loser.id);

                    const { error: delError } = await supabase.from('memorial_spaces').delete().eq('id', loser.id);
                    if (delError) {
                        console.error(`      ❌ Delete failed: ${delError.message}`);
                    } else {
                        console.log(`      ✅ Merged.`);
                        mergeCount++;
                    }
                } else {
                    console.log(`      ✅ [DRY] Would Merge.`);
                    mergeCount++;
                }
            }
        }
    }

    console.log(`\n---------------------------------------`);
    console.log(`Execute Summary (${DRY_RUN ? 'DRY RUN' : 'LIVE'}):`);
    console.log(`Hierarchy Links: ${heirarchyCount}`);
    console.log(`Facilities Merged: ${mergeCount}`);
}

applyFinalFixes();
