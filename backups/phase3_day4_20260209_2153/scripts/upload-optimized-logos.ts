import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import sharp from 'sharp';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 로고 이미지 경로 (아티팩트 디렉토리)
const ARTIFACT_DIR = 'C:/Users/black/.gemini/antigravity/brain/1cb54667-d762-47f5-bc9b-e0347c6b3ddf';
const OUTPUT_DIR = path.join(process.cwd(), 'data/company-logos-optimized');

// 생성된 로고와 회사명 매핑
const LOGO_MAPPINGS = [
    {
        companyName: '보람상조',
        filename: 'boram_sangjo_logo_1768874574010.png',
        outputName: 'boram_sangjo.png'
    },
    {
        companyName: '아가페라이프',
        filename: 'agape_life_logo_1768874589268.png',
        outputName: 'agape_life.png'
    },
    {
        companyName: '휴먼라이프',
        filename: 'human_life_logo_1768874604425.png',
        outputName: 'human_life.png'
    }
];

const BUCKET_NAME = 'company-logos';

async function optimizeAndUploadLogos() {
    console.log('🎨 상조 회사 로고 이미지 최적화 및 업로드\n');
    console.log('='.repeat(70));

    // 1. 출력 디렉토리 생성
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 2. 버킷 확인/생성
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
        console.log(`\n📦 Creating bucket: ${BUCKET_NAME}`);
        const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 1048576, // 1MB
        });
        if (error) {
            console.error('❌ Error creating bucket:', error);
            return;
        }
    }

    console.log('\n📤 이미지 최적화 및 업로드:\n');

    const uploadedUrls: { companyName: string; url: string }[] = [];
    let successCount = 0;

    for (const mapping of LOGO_MAPPINGS) {
        const inputPath = path.join(ARTIFACT_DIR, mapping.filename);
        const outputPath = path.join(OUTPUT_DIR, mapping.outputName);

        try {
            // 파일 존재 확인
            if (!fs.existsSync(inputPath)) {
                console.log(`⚠️  ${mapping.companyName}: 파일 없음 - ${mapping.filename}`);
                continue;
            }

            // 이미지 최적화 (PNG → WebP, 80% 품질, 400x400 리사이즈)
            console.log(`🔄 ${mapping.companyName}: 최적화 중...`);

            const originalSize = fs.statSync(inputPath).size;

            await sharp(inputPath)
                .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .webp({ quality: 85 })
                .toFile(outputPath.replace('.png', '.webp'));

            const optimizedPath = outputPath.replace('.png', '.webp');
            const optimizedSize = fs.statSync(optimizedPath).size;
            const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

            console.log(`  원본: ${(originalSize / 1024).toFixed(1)}KB → 최적화: ${(optimizedSize / 1024).toFixed(1)}KB (${reduction}% 절감)`);

            // Supabase Storage 업로드
            const fileBuffer = fs.readFileSync(optimizedPath);
            const uploadFilename = mapping.outputName.replace('.png', '.webp');

            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(uploadFilename, fileBuffer, {
                    contentType: 'image/webp',
                    upsert: true,
                });

            if (error) {
                console.log(`❌ ${mapping.companyName}: 업로드 실패 - ${error.message}`);
                continue;
            }

            // Public URL 생성
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(uploadFilename);

            uploadedUrls.push({ companyName: mapping.companyName, url: publicUrl });
            console.log(`✅ ${mapping.companyName}: 업로드 완료`);
            console.log(`   URL: ${publicUrl}\n`);

            successCount++;

        } catch (err: any) {
            console.error(`❌ ${mapping.companyName}: 처리 실패 - ${err.message}`);
        }
    }

    // 3. DB 업데이트
    console.log('='.repeat(70));
    console.log('\n📝 DB 업데이트:\n');

    let updateCount = 0;

    for (const { companyName, url } of uploadedUrls) {
        const { data: companies } = await supabase
            .from('funeral_companies')
            .select('id, name, image_url')
            .ilike('name', `%${companyName}%`);

        if (!companies || companies.length === 0) {
            console.log(`⚠️  ${companyName}: DB에서 찾을 수 없음`);
            continue;
        }

        const company = companies[0];
        const { error } = await supabase
            .from('funeral_companies')
            .update({ image_url: url })
            .eq('id', company.id);

        if (error) {
            console.log(`❌ ${companyName}: DB 업데이트 실패`);
        } else {
            console.log(`✅ ${companyName}: DB 업데이트 완료`);
            updateCount++;
        }
    }

    // 4. 요약
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 작업 요약:\n');
    console.log(`총 로고: ${LOGO_MAPPINGS.length}개`);
    console.log(`최적화 및 업로드 성공: ${successCount}개`);
    console.log(`DB 업데이트: ${updateCount}개`);
    console.log(`\n✨ 브랜드 컬러 로고 업로드 완료!`);
}

optimizeAndUploadLogos();
