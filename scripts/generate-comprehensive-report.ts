
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import XLSX from 'xlsx';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Environment variables missing (Supabase Key)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Facility {
    id: number; // Changed to number to match typical Supabase ID if integer, or string if uuid. DB script usually implies int or uuid.
    name: string;
    address: string;
    type: string;
    phone: string;
    lat: number;
    lng: number;
    image_url?: string;
    gallery_images?: any[];
    description?: string;
    prices?: any;
    price_info?: string;
}

interface VerificationResult {
    id: string | number;
    status: 'MATCH' | 'MISMATCH_COORDS' | 'NOT_FOUND_IN_API' | 'NO_DB_COORDS' | 'INVALID_ADDRESS';
    distance_m: number | null;
    note?: string;
    api_address: string | null;
}

async function generateReport() {
    console.log('📊 종합 리포트 생성 중...');

    // 1. Load Verification Results
    const verificationPath = path.resolve('verification_full_result.json');
    if (!fs.existsSync(verificationPath)) {
        console.error('❌ verification_full_result.json not found. Run verification script first.');
        return;
    }

    // Attempt to read Naver result first if available, else standard result
    const naverVerificationPath = path.resolve('verification_full_result_naver.json');
    let useNaver = false;
    let verificationData: VerificationResult[] = [];

    if (fs.existsSync(naverVerificationPath)) {
        console.log('ℹ️ 네이버 검증 결과(verification_full_result_naver.json)를 사용합니다.');
        verificationData = JSON.parse(fs.readFileSync(naverVerificationPath, 'utf-8'));
        useNaver = true;
    } else {
        console.log('ℹ️ 카카오 검증 결과(verification_full_result.json)를 사용합니다.');
        verificationData = JSON.parse(fs.readFileSync(verificationPath, 'utf-8'));
    }

    // Create Map for fast lookup
    const verificationMap = new Map<string, VerificationResult>();
    verificationData.forEach(v => verificationMap.set(String(v.id), v));

    // 2. Fetch All Facilities Details (for OX check)
    console.log('📡 DB 시설 정보 조회 중...');

    let allFacilities: Facility[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('*') // Select all to check fields
            .range(from, from + batchSize - 1);

        if (error) {
            console.error('DB Fetch Error:', error);
            return;
        }

        if (!data || data.length === 0) break;
        allFacilities.push(...data as any[]);
        if (data.length < batchSize) break;
        from += batchSize;
    }

    console.log(`📋 총 ${allFacilities.length}개 시설 정보 분석 중...\n`);

    // 3. Merge Data & Create Report Rows
    const reportRows = allFacilities.map(fac => {
        const vResult = verificationMap.get(String(fac.id));

        // OX Logic
        const hasPhoto = (fac.image_url && fac.image_url.trim() !== '' && !fac.image_url.includes('unsplash')) ||
            (fac.gallery_images && fac.gallery_images.length > 0);

        const hasDescription = (fac.description && fac.description.trim().length > 10);

        // Price Logic: Check JSON 'prices' or text 'price_info'
        let hasPrice = false;
        if (fac.prices && (Array.isArray(fac.prices) && fac.prices.length > 0)) {
            hasPrice = true; // Array format
        } else if (typeof fac.prices === 'object' && fac.prices !== null && Object.keys(fac.prices).length > 0) {
            hasPrice = true; // Object format
        } else if (fac.price_info && typeof fac.price_info === 'string' && fac.price_info.trim().length > 5) {
            hasPrice = true; // Legacy text field
        }

        // Verification Status Text
        let verifyStatus = '검증대기';
        let verifyNote = '';
        let dist = 0;

        if (vResult) {
            dist = vResult.distance_m ? Math.round(vResult.distance_m) : 0;
            if (vResult.status === 'MATCH') {
                verifyStatus = '✅ 정상 (500m이내)';
            } else if (vResult.status === 'MISMATCH_COORDS') {
                verifyStatus = '❌ 좌표불일치';
                verifyNote = vResult.note || '';
            } else if (vResult.status === 'NOT_FOUND_IN_API') {
                verifyStatus = '❓ 미발견';
            } else if (vResult.status === 'NO_DB_COORDS') {
                verifyStatus = '⚠️ DB좌표없음';
            } else {
                verifyStatus = vResult.status;
            }
        }

        return {
            ID: fac.id,
            시설명: fac.name,
            주소: fac.address,
            유형: fac.type,
            전화번호: fac.phone,
            사진보유: hasPhoto ? 'O' : 'X',
            소개보유: hasDescription ? 'O' : 'X',
            가격보유: hasPrice ? 'O' : 'X',
            검증결과: verifyStatus,
            거리차이_m: dist,
            API주소: vResult?.api_address || '',
            비고: verifyNote
        };
    });

    // 4. Generate Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportRows);

    // Set column widths
    const wscols = [
        { wch: 8 },  // ID
        { wch: 30 }, // Name
        { wch: 40 }, // Address
        { wch: 10 }, // Type
        { wch: 15 }, // Phone
        { wch: 8 },  // Photo
        { wch: 8 },  // Desc
        { wch: 8 },  // Price
        { wch: 15 }, // Status
        { wch: 10 }, // Dist
        { wch: 30 }, // API Addr
        { wch: 20 }  // Note
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "종합검증리포트");

    // Write File
    XLSX.writeFile(wb, "memorimap_comprehensive_report.xlsx");

    console.log('✅ 엑셀 파일 생성 완료: memorimap_comprehensive_report.xlsx');
}

generateReport().catch(console.error);
