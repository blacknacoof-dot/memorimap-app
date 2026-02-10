
import * as fs from 'fs';
import * as path from 'path';

const SRC_FILE = '15774129-2025-12-22.csv';
const DEST_FILE = '15774129-2025-12-22-utf8.csv';

async function convert() {
    const srcPath = path.resolve(process.cwd(), SRC_FILE);
    const destPath = path.resolve(process.cwd(), DEST_FILE);

    if (!fs.existsSync(srcPath)) {
        console.error(`❌ 파일 없음: ${SRC_FILE}`);
        return;
    }

    console.log(`📂 읽는 중: ${SRC_FILE}...`);
    const buffer = fs.readFileSync(srcPath);

    // Try decoding as EUC-KR
    const decoder = new TextDecoder('euc-kr');
    const content = decoder.decode(buffer);

    // Simple check: '장례식장' should be present
    if (content.includes('장례식장') || content.includes('병원')) {
        console.log("✅ EUC-KR 인코딩 감지됨.");
        console.log("💾 UTF-8로 저장 중...");
        fs.writeFileSync(destPath, content, 'utf-8');
        console.log(`✨ 완료! 저장된 파일: ${DEST_FILE}`);
    } else {
        console.warn("⚠️ EUC-KR로 디코딩했으나 예상되는 키워드(장례식장, 병원)가 발견되지 않았습니다.");
        console.log("샘플 출력:", content.substring(0, 100));
    }
}

convert();
