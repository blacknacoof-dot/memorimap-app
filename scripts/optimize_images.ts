import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '../data/장례식장 대표이미지');
const OUTPUT_DIR = path.resolve(__dirname, '../data/장례식장 대표이미지_최적화');

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const MAX_FILE_SIZE_KB = 500;
const INITIAL_QUALITY = 85;

async function optimizeImage(inputPath: string, outputPath: string) {
    const filename = path.basename(inputPath);
    console.log(`\n🔧 처리 중: ${filename}`);

    // Get original size
    const originalStats = fs.statSync(inputPath);
    const originalSizeMB = (originalStats.size / (1024 * 1024)).toFixed(2);
    console.log(`   원본 크기: ${originalSizeMB} MB`);

    let quality = INITIAL_QUALITY;
    let optimized = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!optimized && attempts < maxAttempts) {
        attempts++;

        // Process image
        await sharp(inputPath)
            .resize(MAX_WIDTH, MAX_HEIGHT, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({
                quality: quality,
                mozjpeg: true // Better compression
            })
            .toFile(outputPath);

        // Check file size
        const outputStats = fs.statSync(outputPath);
        const outputSizeKB = outputStats.size / 1024;
        const outputSizeMB = (outputStats.size / (1024 * 1024)).toFixed(2);

        if (outputSizeKB <= MAX_FILE_SIZE_KB * 1024) {
            optimized = true;
            const reduction = ((1 - outputStats.size / originalStats.size) * 100).toFixed(1);
            console.log(`   ✅ 완료: ${outputSizeMB} MB (${outputSizeKB.toFixed(0)} KB)`);
            console.log(`   📉 용량 감소: ${reduction}%`);
            console.log(`   🎨 품질: ${quality}%`);
        } else {
            // Reduce quality and try again
            quality -= 5;
            if (quality < 60) {
                console.log(`   ⚠️  경고: 품질 60% 이하로 떨어짐. 현재 ${outputSizeMB} MB로 진행`);
                optimized = true;
            } else {
                console.log(`   ⏳ 재시도 (품질 ${quality}%)...`);
            }
        }
    }

    return outputPath;
}

async function optimizeAllImages() {
    console.log('='.repeat(60));
    console.log('🖼️  이미지 최적화 (Image Optimization)');
    console.log('='.repeat(60));
    console.log(`📂 원본 폴더: ${SOURCE_DIR}`);
    console.log(`📂 출력 폴더: ${OUTPUT_DIR}`);
    console.log(`🎯 목표: JPG, 최대 ${MAX_WIDTH}x${MAX_HEIGHT}px, ${MAX_FILE_SIZE_KB}KB 이하`);
    console.log('='.repeat(60));

    try {
        // Create output directory
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
            console.log(`\n✅ 출력 폴더 생성됨: ${OUTPUT_DIR}\n`);
        }

        // Get all image files
        const files = fs.readdirSync(SOURCE_DIR).filter(f => {
            const ext = path.extname(f).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
        });

        console.log(`\n📊 발견된 이미지: ${files.length}개\n`);

        if (files.length === 0) {
            throw new Error('No image files found!');
        }

        let totalOriginalSize = 0;
        let totalOptimizedSize = 0;

        // Process each image
        for (const [index, file] of files.entries()) {
            const inputPath = path.join(SOURCE_DIR, file);
            const outputName = `funeral_${index + 1}.jpg`;
            const outputPath = path.join(OUTPUT_DIR, outputName);

            const originalSize = fs.statSync(inputPath).size;
            totalOriginalSize += originalSize;

            await optimizeImage(inputPath, outputPath);

            const optimizedSize = fs.statSync(outputPath).size;
            totalOptimizedSize += optimizedSize;
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('🎉 최적화 완료 (Optimization Complete)');
        console.log('='.repeat(60));
        console.log(`✅ 처리된 이미지: ${files.length}개`);
        console.log(`📊 원본 총 용량: ${(totalOriginalSize / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`📊 최적화 총 용량: ${(totalOptimizedSize / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`📉 총 감소율: ${((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(1)}%`);
        console.log();
        console.log(`📁 최적화된 이미지 위치:`);
        console.log(`   ${OUTPUT_DIR}`);
        console.log();
        console.log('🚀 다음 단계:');
        console.log('   npx tsx scripts/upload_real_images.ts');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Optimization failed:', error);
        throw error;
    }
}

optimizeAllImages();
