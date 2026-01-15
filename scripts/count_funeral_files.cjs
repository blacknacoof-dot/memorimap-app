
const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/black/Desktop/memorimap/장례식장';

function countRows() {
    try {
        const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.csv'));

        console.log(`\n📊 장례식장 파일 데이터 카운트 (폴더: ${targetDir})\n`);

        let grandTotal = 0;

        const results = files.map(file => {
            const content = fs.readFileSync(path.join(targetDir, file), 'utf8');
            // Split by newline and filter empty lines
            const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

            // Assume 1 header row, so count is lines.length - 1
            // Check if file is empty or just header
            const count = lines.length > 0 ? lines.length - 1 : 0;

            grandTotal += count;
            return { file, count };
        });

        // Sort by filename for better readability
        results.sort((a, b) => a.file.localeCompare(b.file));

        results.forEach(({ file, count }) => {
            console.log(`- ${file}: ${count}개`);
        });

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ 총 합계: ${grandTotal}개`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (err) {
        console.error('오류 발생:', err.message);
    }
}

countRows();
