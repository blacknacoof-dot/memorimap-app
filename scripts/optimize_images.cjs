/**
 * 시설 기본 이미지 WebP 최적화
 * 실행: node scripts/optimize_images.cjs
 *
 * - funeral JPG → WebP (quality 80, max 800px)
 * - natural PNG → WebP (quality 80, max 800px)
 * - cemetery PNG → WebP (quality 80, max 800px)
 * - 원본은 originals/ 폴더에 백업
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DEFAULTS_DIR = path.resolve(__dirname, '../public/images/defaults');

const TARGETS = [
  { folder: 'funeral', ext: '.jpg' },
  { folder: 'natural', ext: '.png' },
  { folder: 'cemetery', ext: '.png' },
];

const MAX_WIDTH = 800;
const QUALITY = 80;

async function optimizeFolder(folder, ext) {
  const dir = path.join(DEFAULTS_DIR, folder);
  const originalsDir = path.join(dir, 'originals');

  if (!fs.existsSync(dir)) {
    console.log(`  ⚠️ 폴더 없음: ${dir}`);
    return;
  }

  // originals 백업 폴더 생성
  if (!fs.existsSync(originalsDir)) {
    fs.mkdirSync(originalsDir, { recursive: true });
  }

  const files = fs.readdirSync(dir).filter(f => {
    const lower = f.toLowerCase();
    return (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) && !f.startsWith('.');
  });

  console.log(`\n=== ${folder} (${files.length}장) ===`);

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const inputPath = path.join(dir, file);
    const stat = fs.statSync(inputPath);

    // 이미 originals에 있으면 스킵
    if (file === 'originals') continue;

    const baseName = path.basename(file, path.extname(file));
    const webpName = `${baseName}.webp`;
    const webpPath = path.join(dir, webpName);
    const backupPath = path.join(originalsDir, file);

    // 원본 백업
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(inputPath, backupPath);
    }

    // WebP 변환
    const result = await sharp(inputPath)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(webpPath);

    const beforeKB = Math.round(stat.size / 1024);
    const afterKB = Math.round(result.size / 1024);
    const reduction = Math.round((1 - result.size / stat.size) * 100);

    totalBefore += stat.size;
    totalAfter += result.size;

    console.log(`  ✅ ${file} (${beforeKB}KB) → ${webpName} (${afterKB}KB) [-${reduction}%]`);

    // 원본은 originals에 백업됨, 삭제는 수동으로 (Windows 파일잠금 대응)
  }

  const totalBeforeKB = Math.round(totalBefore / 1024);
  const totalAfterKB = Math.round(totalAfter / 1024);
  const totalReduction = Math.round((1 - totalAfter / totalBefore) * 100);
  console.log(`  📊 합계: ${totalBeforeKB}KB → ${totalAfterKB}KB [-${totalReduction}%]`);
}

async function main() {
  console.log('🖼️ 이미지 최적화 시작\n');
  console.log(`설정: maxWidth=${MAX_WIDTH}px, quality=${QUALITY}, format=webp`);

  for (const { folder, ext } of TARGETS) {
    await optimizeFolder(folder, ext);
  }

  console.log('\n✅ 전체 완료');
}

main().catch(console.error);
