import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createCanvas, registerFont } from 'canvas';
import sharp from 'sharp';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const OUTPUT_DIR = path.join(process.cwd(), 'data/company-logos-text');
const BUCKET_NAME = 'company-logos';

// 나머지 회사 브랜드 컬러 정의
const COMPANIES = [
    { name: '더리본', slug: 'the_ribbon', bgColor: '#E91E8C', textColor: '#FFFFFF' },
    { name: '보람상조피플', slug: 'boram_people', bgColor: '#C41E3A', textColor: '#FFFFFF' },
    { name: '에이치디투어존', slug: 'hd_tourzone', bgColor: '#005EB8', textColor: '#FFFFFF' },
    { name: '불국토', slug: 'bulgukto', bgColor: '#FF6B00', textColor: '#FFFFFF' },
    { name: '우리제주상조', slug: 'woori_jeju', bgColor: '#00A651', textColor: '#FFFFFF' },
];

// 엘비라이프는 이미 실제 로고 URL이 있음 (제외)

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

async function generateTextLogos() {
    console.log('🎨 상호명 텍스트 로고 생성\n');
    console.log('='.repeat(70));

    // 출력 디렉토리 생성
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const uploadedUrls: { companyName: string; url: string }[] = [];

    for (const company of COMPANIES) {
        console.log(`\n🔄 ${company.name}: 생성 중...`);

        try {
            // Canvas 생성 (400x400)
            const canvas = createCanvas(400, 400);
            const ctx = canvas.getContext('2d');

            // 배경색
            ctx.fillStyle = company.bgColor;
            ctx.fillRect(0, 0, 400, 400);

            // 텍스트 설정
            ctx.fillStyle = company.textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 폰트 크기 자동 조정
            let fontSize = 80;
            ctx.font = `bold ${fontSize}px "Malgun Gothic", "맑은 고딕", sans-serif`;

            while (ctx.measureText(company.name).width > 360 && fontSize > 30) {
                fontSize -= 5;
                ctx.font = `bold ${fontSize}px "Malgun Gothic", "맑은 고딕", sans-serif`;
            }

            // 텍스트 그리기
            ctx.fillText(company.name, 200, 200);

            // PNG로 저장
            const pngPath = path.join(OUTPUT_DIR, `${company.slug}.png`);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(pngPath, buffer);

            const originalSize = buffer.length;

            // WebP로 최적화
            const webpPath = pngPath.replace('.png', '.webp');
            await sharp(buffer)
                .webp({ quality: 85 })
                .toFile(webpPath);

            const optimizedSize = fs.statSync(webpPath).size;
            const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

            console.log(`  원본: ${(originalSize / 1024).toFixed(1)}KB → 최적화: ${(optimizedSize / 1024).toFixed(1)}KB (${reduction}% 절감)`);

            // Supabase Storage 업로드
            const fileBuffer = fs.readFileSync(webpPath);
            const uploadFilename = `${company.slug}.webp`;

            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(uploadFilename, fileBuffer, {
                    contentType: 'image/webp',
                    upsert: true,
                });

            if (error) {
                console.log(`❌ 업로드 실패: ${error.message}`);
                continue;
            }

            // Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(uploadFilename);

            uploadedUrls.push({ companyName: company.name, url: publicUrl });
            console.log(`✅ 업로드 완료: ${publicUrl}`);

        } catch (err: any) {
            console.error(`❌ ${company.name}: 실패 - ${err.message}`);
        }
    }

    // DB 업데이트
    console.log('\n' + '='.repeat(70));
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

    // 요약
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 작업 요약:\n');
    console.log(`총 로고: ${COMPANIES.length}개`);
    console.log(`생성 및 업로드 성공: ${uploadedUrls.length}개`);
    console.log(`DB 업데이트: ${updateCount}개`);
    console.log(`\n✨ 텍스트 로고 생성 완료!`);
}

generateTextLogos();
