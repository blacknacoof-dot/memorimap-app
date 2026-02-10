
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { csvParse } from 'd3-dsv'; // Or manual if not available, let's use manual for zero-dep

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

function normalizeName(name: string): string {
    return name
        .replace(/\s+/g, '') // Remove spaces
        .replace(/\(주\)|\(재\)|\(사\)|\(유\)|주식회사/g, '') // Remove corporate types
        .replace(/장례식장|장례|병원|의료원/g, '') // Remove generic suffixes for clearer core name match?
    // Too aggressive might cause false positives (e.g. 서울병원 vs 서울장례식장 -> 서울 vs 서울)
    // Let's stick to spaces and corporate markers first for safety.
    // Re-thinking: Just removing spaces and corporate markers is safer.
}

function safeNormalize(name: string): string {
    return name
        .replace(/\s+/g, '') // Remove spaces
        .replace(/\(주\)|\(재\)|\(사\)|\(유\)|주식회사/g, '') // Remove corporate types
        .trim();
}

// Helper to decode EUC-KR and extract names + data
function extractData(filePath: string) {
    if (!fs.existsSync(filePath)) return {};
    const buffer = fs.readFileSync(filePath);
    const decoder = new TextDecoder('euc-kr');
    const content = decoder.decode(buffer);
    const lines = content.split(/\r?\n/);

    const dataMap: Record<string, any[]> = {}; // normalizedName -> items

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!parts || parts.length < 7) continue;

        const originalName = parts[2].replace(/"/g, '').trim();
        const normName = safeNormalize(originalName);

        // Data extraction
        const item = {
            category: parts[3].replace(/"/g, '').trim(),
            item: parts[4].replace(/"/g, '').trim(),
            spec: parts[5].replace(/"/g, '').trim(),
            price: parts[6].replace(/"/g, '').replace(/,/g, '').trim()
        };

        if (!dataMap[normName]) dataMap[normName] = [];
        dataMap[normName].push(item);
    }
    return dataMap;
}

async function improvedVerify() {
    console.log("🔍 Improving Match Rate with Normalization...");

    // 1. Load CSV Data
    console.log("📂 processing CSVs...");
    const funeralData = extractData(FILE_2_PATH);
    const etcData = extractData(FILE_3_PATH);

    const combinedData = { ...funeralData, ...etcData };
    const csvNormNames = Object.keys(combinedData);
    console.log(`   Total Unique Facilities in CSV (Normalized): ${csvNormNames.length}`);

    // 2. Load DB Data
    console.log("📡 Fetching DB facilities...");
    const { data: dbFacilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name');

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    // 3. Match
    let matchCount = 0;
    const matches: { id: string, name: string, prices: any[] }[] = [];

    for (const dbFac of dbFacilities || []) {
        const dbNorm = safeNormalize(dbFac.name);

        if (combinedData[dbNorm]) {
            matchCount++;
            matches.push({
                id: dbFac.id,
                name: dbFac.name,
                prices: combinedData[dbNorm]
            });
        }
    }

    console.log(`\n📋 Improved Result:`);
    console.log(`✅ Matched: ${matchCount} / ${dbFacilities?.length} DB entries`);
    console.log(`   (Original CSV count: ${csvNormNames.length})`);

    if (matchCount > 0) {
        console.log(`\n💾 Saving ALL ${matchCount} matches to 'full_price_update.json'...`);
        fs.writeFileSync('full_price_update.json', JSON.stringify(matches, null, 2), 'utf-8');
    }
}

improvedVerify();
