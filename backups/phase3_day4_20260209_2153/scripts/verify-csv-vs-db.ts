
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

// File Paths
const FILE_2_PATH = path.resolve(process.cwd(), 'data/2023년 6월/2.장례식장가격정보_20230601.csv');
const FILE_3_PATH = path.resolve(process.cwd(), 'data/2023년 6월/3.장사시설(장례식장제외)가격정보_20230601.csv');

// Helper to read CSV and get unique facility names
function getUniqueNamesFromCSV(filePath: string): Set<string> {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return new Set();
    }
    const buffer = fs.readFileSync(filePath);
    const decoder = new TextDecoder('euc-kr');
    const content = decoder.decode(buffer);

    const lines = content.split(/\r?\n/);
    const names = new Set<string>();

    // Header: 시설종류,순번,장사시설명,...
    // Index 2 is likely Name

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!parts || parts.length < 3) continue;

        let name = parts[2].replace(/"/g, '').trim();
        if (name) names.add(name);
    }
    return names;
}

// Helper to parse price row
// Return object with name and price item
function parsePriceRows(filePath: string) {
    const buffer = fs.readFileSync(filePath);
    const decoder = new TextDecoder('euc-kr');
    const content = decoder.decode(buffer);
    const lines = content.split(/\r?\n/);

    const pricesByFacility: Record<string, any[]> = {};

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!parts || parts.length < 7) continue;

        // 2: Name, 3: Category, 4: Item, 5: Spec, 6: Price
        const name = parts[2].replace(/"/g, '').trim();
        const category = parts[3].replace(/"/g, '').trim();
        const item = parts[4].replace(/"/g, '').trim();
        const spec = parts[5].replace(/"/g, '').trim();
        const price = parts[6].replace(/"/g, '').replace(/,/g, '').trim();

        if (!pricesByFacility[name]) pricesByFacility[name] = [];
        pricesByFacility[name].push({
            category,
            item,
            spec,
            price
        });
    }
    return pricesByFacility;
}

async function verify() {
    console.log("🔍 Verifying 2023 Data vs Current Database (With EUC-KR Decoding)...");

    // 1. Get Names
    console.log(`📂 Reading ${path.basename(FILE_2_PATH)}...`);
    const namesFuneral = getUniqueNamesFromCSV(FILE_2_PATH);
    const pricesFuneral = parsePriceRows(FILE_2_PATH);
    console.log(`   Found ${namesFuneral.size} facilities.`);

    console.log(`📂 Reading ${path.basename(FILE_3_PATH)}...`);
    const namesEtc = getUniqueNamesFromCSV(FILE_3_PATH);
    const pricesEtc = parsePriceRows(FILE_3_PATH);
    console.log(`   Found ${namesEtc.size} facilities.`);

    const allCsvNames = new Set([...namesFuneral, ...namesEtc]);

    // 2. DB Fetch
    console.log("📡 Fetching all facility names from Database...");
    let { data: dbFacilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name');

    if (error) {
        console.error("❌ DB Error:", error);
        return;
    }

    const dbMap = new Map<string, string>(); // Name -> ID
    dbFacilities?.forEach(f => dbMap.set(f.name.trim(), f.id));

    console.log(`   Found ${dbMap.size} facilities in DB.`);

    // 3. Compare
    let matchedCount = 0;
    const mismatchedNames: string[] = [];

    // Prepare samples for upload
    const matchedFunerals: { id: string, name: string, prices: any[] }[] = [];
    const matchedEtc: { id: string, name: string, prices: any[] }[] = [];

    for (const csvName of allCsvNames) {
        if (dbMap.has(csvName)) {
            matchedCount++;
            const id = dbMap.get(csvName)!;

            // Check if it's funeral or etc (simple check based on set membership)
            if (namesFuneral.has(csvName)) {
                if (matchedFunerals.length < 10 && pricesFuneral[csvName]?.length > 0) {
                    matchedFunerals.push({ id, name: csvName, prices: pricesFuneral[csvName] });
                }
            } else if (namesEtc.has(csvName)) {
                if (matchedEtc.length < 10 && pricesEtc[csvName]?.length > 0) {
                    matchedEtc.push({ id, name: csvName, prices: pricesEtc[csvName] });
                }
            }
        } else {
            mismatchedNames.push(csvName);
        }
    }

    console.log(`\n📋 Verification Result:`);
    console.log(`✅ Matched: ${matchedCount} / ${allCsvNames.size} (${((matchedCount / allCsvNames.size) * 100).toFixed(1)}%)`);
    console.log(`❌ Not in DB: ${mismatchedNames.length}`);

    if (matchedCount > 0) {
        console.log(`\n📦 Ready for Sample Upload:`);
        console.log(` - Funeral Samples: ${matchedFunerals.length}`);
        console.log(` - Other Samples: ${matchedEtc.length}`);

        // Save to temporary file for the next script to use
        const samples = {
            funerals: matchedFunerals,
            others: matchedEtc
        };
        fs.writeFileSync('temp_price_samples.json', JSON.stringify(samples, null, 2), 'utf-8');
        console.log(`💾 Samples saved to 'temp_price_samples.json'`);
    }

    console.log(`\n❓ Top 5 Mismatches:`);
    mismatchedNames.slice(0, 5).forEach(m => console.log(` - ${m}`));
}

verify();
