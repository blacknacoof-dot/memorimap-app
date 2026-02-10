import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function compareSangjoSources() {
    console.log('📊 상조 업체 데이터 소스 비교 분석\n');
    console.log('='.repeat(80));

    // 1. Load constants.ts data (FUNERAL_COMPANIES)
    const constantsPath = path.resolve(__dirname, '../constants.ts');
    const constantsContent = fs.readFileSync(constantsPath, 'utf-8');

    // Extract company names from FUNERAL_COMPANIES array using regex
    const funeralCompaniesMatch = constantsContent.match(/export const FUNERAL_COMPANIES: FuneralCompany\[\] = \[([\s\S]*?)\];/);
    const companyNames: string[] = [];

    if (funeralCompaniesMatch) {
        const matches = funeralCompaniesMatch[1].matchAll(/name: '([^']+)'/g);
        for (const match of matches) {
            companyNames.push(match[1]);
        }
    }

    console.log(`\n📚 constants.ts (FUNERAL_COMPANIES)`);
    console.log(`   총 ${companyNames.length}개 상조 추천 업체\n`);

    // 2. Fetch facilities table data
    const { data: facilities, error } = await supabase
        .from('facilities')
        .select('id, name, address, category')
        .or('category.eq.sangjo,name.ilike.%상조%,name.ilike.%서비스%')
        .order('name');

    if (error) {
        console.error('❌ Error fetching facilities:', error);
        return;
    }

    console.log(`\n💾 시설 DB (facilities)`);
    console.log(`   총 ${facilities?.length || 0}개 상조 관련 시설\n`);

    // 3. Compare and analyze
    console.log('='.repeat(80));
    console.log('\n🔍 비교 분석 결과\n');

    const normalize = (str: string) => str.replace(/\s/g, '').toLowerCase();

    const constantsNormalized = new Set(companyNames.map(normalize));
    const facilitiesNames = facilities?.map(f => f.name) || [];
    const facilitiesNormalized = new Set(facilitiesNames.map(normalize));

    // Find matches
    const matches: Array<{ constant: string, facility: string }> = [];
    const onlyInConstants: string[] = [];
    const onlyInFacilities: string[] = [];

    companyNames.forEach(constName => {
        const normalized = normalize(constName);
        const facilityMatch = facilitiesNames.find(facName => normalize(facName) === normalized);

        if (facilityMatch) {
            matches.push({ constant: constName, facility: facilityMatch });
        } else {
            onlyInConstants.push(constName);
        }
    });

    facilitiesNames.forEach(facName => {
        const normalized = normalize(facName);
        if (!constantsNormalized.has(normalized)) {
            onlyInFacilities.push(facName);
        }
    });

    console.log(`✅ **양쪽 모두 존재** (${matches.length}개):`);
    if (matches.length > 0) {
        matches.forEach(({ constant, facility }, idx) => {
            if (constant === facility) {
                console.log(`   ${idx + 1}. ${constant}`);
            } else {
                console.log(`   ${idx + 1}. ${constant} ≈ ${facility}`);
            }
        });
    } else {
        console.log('   없음');
    }

    console.log(`\n📚 **constants.ts에만 존재** (${onlyInConstants.length}개):`);
    if (onlyInConstants.length > 0) {
        onlyInConstants.forEach((name, idx) => {
            console.log(`   ${idx + 1}. ${name}`);
        });
    } else {
        console.log('   없음');
    }

    console.log(`\n💾 **facilities DB에만 존재** (${onlyInFacilities.length}개):`);
    if (onlyInFacilities.length > 0) {
        onlyInFacilities.forEach((name, idx) => {
            console.log(`   ${idx + 1}. ${name}`);
        });
    } else {
        console.log('   없음');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📈 요약 통계');
    console.log(`   constants.ts 추천 업체: ${companyNames.length}개`);
    console.log(`   facilities DB 상조 시설: ${facilities?.length || 0}개`);
    console.log(`   중복 (동일 업체): ${matches.length}개`);
    console.log(`   constants.ts 전용: ${onlyInConstants.length}개`);
    console.log(`   facilities DB 전용: ${onlyInFacilities.length}개`);
    console.log(`   중복률: ${((matches.length / Math.max(companyNames.length, facilities?.length || 0)) * 100).toFixed(1)}%`);
    console.log('='.repeat(80));
}

compareSangjoSources();
