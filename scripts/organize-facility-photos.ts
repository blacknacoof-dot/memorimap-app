
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source folders and their target folder names
const FACILITY_PHOTOS = [
    { source: '시안가족추모공원 - Google 지도', target: 'sian', facilityName: '시안가족추모공원' },
    { source: '에덴낙원 - 네이버지도', target: 'eden', facilityName: '에덴낙원' },
    { source: '용인 평온의숲 - 네이버지도', target: 'yongin-pyeonon', facilityName: '용인 평온의 숲' },
    { source: '유토피아추모관 - 네이버지도', target: 'utopia', facilityName: '유토피아추모관' },
];

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'public', 'images', 'facilities');

// Ensure output directories exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log('=== Organizing Facility Photos ===\n');

const photoMapping: any[] = [];

FACILITY_PHOTOS.forEach(facility => {
    const sourceDir = path.join(projectRoot, facility.source);
    const targetDir = path.join(outputDir, facility.target);

    if (!fs.existsSync(sourceDir)) {
        console.log(`⚠️ Source not found: ${facility.source}`);
        return;
    }

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const files = fs.readdirSync(sourceDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    console.log(`📁 ${facility.facilityName}: ${files.length} photos`);

    const copiedUrls: string[] = [];

    files.forEach((file, idx) => {
        const ext = path.extname(file).toLowerCase();
        const newName = `${facility.target}_${idx + 1}${ext}`;
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, newName);

        fs.copyFileSync(sourcePath, targetPath);
        console.log(`  ✓ ${file} → ${newName}`);

        copiedUrls.push(`/images/facilities/${facility.target}/${newName}`);
    });

    photoMapping.push({
        facilityName: facility.facilityName,
        folder: facility.target,
        urls: copiedUrls,
    });
});

// Save mapping for database update
const mappingPath = path.join(__dirname, 'facility_photos_mapping.json');
fs.writeFileSync(mappingPath, JSON.stringify(photoMapping, null, 2));
console.log(`\n✅ Mapping saved to ${mappingPath}`);

console.log('\n=== Summary ===');
photoMapping.forEach(m => {
    console.log(`${m.facilityName}: ${m.urls.length} photos → ${m.folder}/`);
});
