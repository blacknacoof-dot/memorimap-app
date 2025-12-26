
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { csvParse } from 'd3-dsv';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

// File Paths
const FILE_2_PATH = path.resolve(process.cwd(), 'data/2023년 6월/2.장례식장가격정보_20230601.csv');
const FILE_3_PATH = path.resolve(process.cwd(), 'data/2023년 6월/3.장사시설(장례식장제외)가격정보_20230601.csv');

// Load Data
function extractData(filePath: string) {
    if (!fs.existsSync(filePath)) return {};
    const buffer = fs.readFileSync(filePath);
    const decoder = new TextDecoder('euc-kr');
    const content = decoder.decode(buffer);
    const lines = content.split(/\r?\n/);

    const dataMap: Record<string, { originalName: string, items: any[] }> = {};

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!parts || parts.length < 7) continue;

        const originalName = parts[2].replace(/"/g, '').trim();

        // Key for map is just original name for now, we will iterate
        const item = {
            category: parts[3].replace(/"/g, '').trim(),
            item: parts[4].replace(/"/g, '').trim(),
            spec: parts[5].replace(/"/g, '').trim(),
            price: parts[6].replace(/"/g, '').replace(/,/g, '').trim()
        };

        if (!dataMap[originalName]) {
            dataMap[originalName] = { originalName, items: [] };
        }
        dataMap[originalName].items.push(item);
    }
    return dataMap;
}

function normalize(name: string): string {
    return name
        .replace(/\s+/g, '')
        .replace(/\(주\)|\(재\)|\(사\)|\(유\)|주식회사|유한회사|재단법인|사단법인|의료법인/g, '')
        .replace(/장례식장|장례|병원|의료원|추모공원|공원묘원|묘지/g, '')
        .trim();
}

async function fuzzyMatch() {
    console.log("🔮 Starting Fuzzy Matching...");

    // 1. Load CSV Data
    const funeralData = extractData(FILE_2_PATH);
    const etcData = extractData(FILE_3_PATH);
    const allCsvData = { ...funeralData, ...etcData };
    const csvKeys = Object.keys(allCsvData);

    console.log(`   Loaded ${csvKeys.length} facilities from CSV.`);

    // 2. Load DB Facilities
    // Fetch ALL to check status in memory (safer for JSON fields)
    const { data: dbFacilities } = await supabase
        .from('memorial_spaces')
        .select('id, name, price_info');

    if (!dbFacilities) {
        console.log("No facilities found in DB.");
        return;
    }

    // Filter targets: No price info or empty items
    const targets = dbFacilities.filter(f => {
        if (!f.price_info) return true;
        if (!f.price_info.items || f.price_info.items.length === 0) return true;
        return false;
    });

    console.log(`   Total DB: ${dbFacilities.length}`);
    console.log(`   Targeting ${targets.length} facilities without price info...`);

    const fuzzyMatches: any[] = [];

    for (const dbFac of targets) {
        const dbNorm = normalize(dbFac.name);
        if (dbNorm.length < 2) continue; // too short to match safely

        // Try to find in CSV keys
        let bestMatch: string | null = null;

        for (const csvKey of csvKeys) {
            const csvNorm = normalize(csvKey);

            // Contains logic
            if (csvNorm.includes(dbNorm) || dbNorm.includes(csvNorm)) {
                // Must be careful about very short name collision
                if (csvNorm === dbNorm) {
                    bestMatch = csvKey;
                    break;
                }

                // If one contains the other and length difference is small?
                // e.g. "용인공원" (DB) in "재단법인용인공원" (CSV) -> Safe
                // e.g. "서울" in "서울장례식장" -> Too generic (But we removed '장례식장' in normalize)
                // So now normalization is aggressively stripping suffixes.
                // "서울" in "서울" -> match.

                if (Math.abs(csvNorm.length - dbNorm.length) < 3) {
                    bestMatch = csvKey;
                    // console.log(`   Found potential match: ${dbFac.name} <-> ${csvKey}`);
                    break;
                }
            }
        }

        if (bestMatch) {
            fuzzyMatches.push({
                id: dbFac.id,
                dbName: dbFac.name,
                csvName: bestMatch,
                prices: allCsvData[bestMatch].items
            });
        }
    }

    console.log(`\n✨ Fuzzy Matching Results:`);
    console.log(`   Found ${fuzzyMatches.length} new matches!`);

    // Save
    if (fuzzyMatches.length > 0) {
        fs.writeFileSync('fuzzy_matches.json', JSON.stringify(fuzzyMatches, null, 2), 'utf-8');
        console.log(`   Saved to 'fuzzy_matches.json'. Execute upload script manually or request auto-run.`);
    }
}

fuzzyMatch();
