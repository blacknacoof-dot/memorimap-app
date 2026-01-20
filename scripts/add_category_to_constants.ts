// constants.ts의 Facility 객체에 category 필드를 추가하는 스크립트
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '../constants.ts');
let content = fs.readFileSync(filePath, 'utf8');

// type에서 category로 매핑
const typeToCategory: Record<string, string> = {
    'park': "'공원묘지'",
    'complex': "'공원묘지'",
    'charnel': "'봉안시설'",
    'natural': "'자연장'",
    'funeral': "'장례식장'",
    'pet': "'동물장례'",
    'sea': "'해양장'",
    'sangjo': "'상조'"
};

// type: 'X', 뒤에 category: 'Y',를 추가
Object.entries(typeToCategory).forEach(([typeValue, categoryValue]) => {
    const pattern = new RegExp(`(\\s+type:\\s*'${typeValue}',)(\\s+)`, 'g');
    const replacement = `$1\n    category: ${categoryValue},$2`;
    content = content.replace(pattern, replacement);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Successfully added category fields');
