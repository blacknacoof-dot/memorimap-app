
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function generatePrompt() {
    console.log('AI Studio용 프롬프트 생성 중...');

    // 사진 없는 시설 조회 (상위 10개)
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, type')
        .or('image_url.is.null,image_url.eq.""') // image_url이 없거나 빈 문자열
        .is('gallery_images', null) // gallery_images가 null인 경우만
        .order('id')
        .limit(10); // 테스트용 10개

    if (error) {
        console.error(error);
        return;
    }

    let content = `다음 장례 관련 시설들의 **실제 대표 사진(외관 또는 내부) URL**을 1개씩 검색해서 찾아줘.
결과는 반드시 아래 **JSON 배열 형식**으로만 출력해줘. 다른 설명은 필요 없어.
이미지가 검색되지 않으면 url은 null로 해줘.

[
  { "id": 시설ID, "name": "시설명", "url": "이미지URL" },
  ...
]

### 대상 시설 목록
`;

    facilities.forEach(f => {
        content += `${f.id} | ${f.name} | ${f.address || ''} (${f.type})\n`;
    });

    const outputPath = 'scripts/prompt_for_ai_images_10.txt';
    fs.writeFileSync(outputPath, content);
    console.log(`✅ 프롬프트 파일 생성 완료: ${outputPath}`);
    console.log('이 파일의 내용을 복사해서 Google AI Studio에 붙여넣으세요.');
}

generatePrompt();
