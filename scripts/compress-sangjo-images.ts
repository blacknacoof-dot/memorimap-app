import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SOURCE_DIR = 'C:/Users/black/Desktop/memorimap/data/상조서비스 이미지';
const OUTPUT_DIR = 'C:/Users/black/Desktop/memorimap/data/상조서비스 이미지_최적화';

async function compressImages() {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Get all image files
    const files = fs.readdirSync(SOURCE_DIR).filter(file =>
        /\.(jpg|jpeg|png)$/i.test(file)
    );

    console.log(`Found ${files.length} images to compress`);

    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    for (const file of files) {
        const inputPath = path.join(SOURCE_DIR, file);
        const outputPath = path.join(OUTPUT_DIR, file.replace(/\.(jpg|jpeg|png)$/i, '.jpg'));

        try {
            // Get original file size
            const originalStats = fs.statSync(inputPath);
            totalOriginalSize += originalStats.size;

            // Compress and convert to JPG
            await sharp(inputPath)
                .resize(1200, 1200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({
                    quality: 80,
                    progressive: true
                })
                .toFile(outputPath);

            // Get compressed file size
            const compressedStats = fs.statSync(outputPath);
            totalCompressedSize += compressedStats.size;

            const reduction = ((1 - compressedStats.size / originalStats.size) * 100).toFixed(1);
            console.log(`✓ ${file}: ${(originalStats.size / 1024).toFixed(1)}KB → ${(compressedStats.size / 1024).toFixed(1)}KB (${reduction}% reduction)`);
        } catch (error) {
            console.error(`✗ Error processing ${file}:`, error);
        }
    }

    const totalReduction = ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1);
    console.log(`\n총 압축 결과:`);
    console.log(`원본 크기: ${(totalOriginalSize / 1024).toFixed(1)}KB`);
    console.log(`압축 크기: ${(totalCompressedSize / 1024).toFixed(1)}KB`);
    console.log(`용량 절감: ${totalReduction}%`);
}

compressImages().catch(console.error);
