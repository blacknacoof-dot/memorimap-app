
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

function safeNormalize(name: string): string {
    return name
        .replace(/\s+/g, '')
        .replace(/\(주\)|\(재\)|\(사\)|\(유\)|주식회사|유한회사|재단법인|사단법인|의료법인/g, '')
        .replace(/장례식장$|병원$|의료원$/g, '') // Remove suffixes for comparison? No, risky. 
        // Let's stick to safe Normalization 1.0 (spaces + corp types)
        .replace(/\(주\)|\(재\)|\(사\)|\(유\)|주식회사/g, '')
        .trim();
}

// Extra aggressive normalization for fuzzy matching suggestions
function aggressiveNormalize(name: string): string {
    return name
        .replace(/\s+/g, '')
        .replace(/\(주\)|\(재\)|\(사\)|\(유\)|주식회사|유한회사|재단법인|사단법인|의료법인/g, '')
        .replace(/장례식장|장례|병원|의료원|추모공원|공원묘원|묘지/g, '')
        .trim();
}

function getUniqueNamesFromCSV(filePath: string): Set<string> {
    if (!fs.existsSync(filePath)) return new Set();
    const buffer = fs.readFileSync(filePath);
    const decoder = new TextDecoder('euc-kr');
    const content = decoder.decode(buffer);
    const lines = content.split(/\r?\n/);
    const names = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!parts || parts.length < 3) continue;
        const name = parts[2].replace(/"/g, '').trim();
        if (name) names.add(safeNormalize(name));
    }
    return names;
}

async function findMismatches() {
    console.log("🔍 Identifying Mismatched Facilities...");

    // 1. Load CSV Names (Available Data)
    console.log("📂 processing CSVs...");
    const csvNames2 = getUniqueNamesFromCSV(FILE_2_PATH);
    const csvNames3 = getUniqueNamesFromCSV(FILE_3_PATH);
    const allCsvNames = new Set([...csvNames2, ...csvNames3]);

    console.log(`   Total Unique Facilities in 2023 Data: ${allCsvNames.size}`);

    // 2. Load DB Facilities (Our Targets)
    console.log("📡 Fetching DB facilities...");
    const { data: dbFacilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, type');

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    const unmatched: any[] = [];
    const matched: any[] = [];

    // 3. Match Logic
    for (const fac of dbFacilities || []) {
        const normName = safeNormalize(fac.name);

        if (allCsvNames.has(normName)) {
            matched.push(fac);
        } else {
            // Fuzzy Suggestion?
            // Check if any CSV name contains the core part of this name
            const core = aggressiveNormalize(fac.name);
            let suggestion = '';

            // Only try fuzzy if core is long enough to be significant
            if (core.length >= 2) {
                // Find potential matches in CSV (expensive but useful for report)
                // Optimization: Just check if we can find it.
            }

            unmatched.push({ ...fac, normName });
        }
    }

    console.log(`\n📋 Status Report:`);
    console.log(`✅ Matched (Has Price Data): ${matched.length} / ${dbFacilities?.length}`);
    console.log(`❌ Unmatched (Missing Price Data): ${unmatched.length}`);

    // 4. Export Unmatched List
    if (unmatched.length > 0) {
        const csvContent = [
            'ID,Name,Type,Address,NormalizedName,Note',
            ...unmatched.map(f => `"${f.id}","${f.name}","${f.type}","${f.address}","${f.normName}","No exact match in 2023 data"`)
        ].join('\n');

        fs.writeFileSync('unmatched_facilities.csv', csvContent, 'utf-8');
        console.log(`\n💾 Unmatched list saved to 'unmatched_facilities.csv' (${unmatched.length} records)`);

        console.log("\n👀 Top 10 Unmatched Examples:");
        unmatched.slice(0, 10).forEach(f => console.log(` - ${f.name} (${f.address})`));
    }
}

findMismatches();
