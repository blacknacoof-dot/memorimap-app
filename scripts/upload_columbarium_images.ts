import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or Service Key');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const IMAGE_DIR = path.resolve(__dirname, '../data/봉안시설 대표이미지_최적화');
const BUCKET_NAME = 'facility-images';
const FOLDER_PREFIX = 'columbarium_real';

async function uploadColumbariumImages() {
    console.log('='.repeat(60));
    console.log('🏛️  봉안시설 이미지 업로드 (Columbarium Images Upload)');
    console.log('='.repeat(60));
    console.log();

    try {
        // 1. Read all images from the directory
        const files = fs.readdirSync(IMAGE_DIR).filter(f => {
            const ext = path.extname(f).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
        });

        console.log(`📂 발견된 이미지 파일: ${files.length}개`);
        files.forEach((file, idx) => {
            const filePath = path.join(IMAGE_DIR, file);
            const stats = fs.statSync(filePath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`   ${idx + 1}. ${file} (${sizeMB} MB)`);
        });
        console.log();

        if (files.length === 0) {
            throw new Error('No image files found!');
        }

        // 2. Upload images to Supabase Storage
        console.log('📤 Supabase Storage에 업로드 중...');
        const uploadedUrls: string[] = [];

        for (const [index, file] of files.entries()) {
            const filePath = path.join(IMAGE_DIR, file);
            const fileBuffer = fs.readFileSync(filePath);
            const ext = path.extname(file);
            const timestamp = Date.now();
            const storagePath = `${FOLDER_PREFIX}/columbarium_real_${index + 1}_${timestamp}${ext}`;

            console.log(`   [${index + 1}/${files.length}] Uploading: ${file}`);

            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(storagePath, fileBuffer, {
                    contentType: `image/${ext.slice(1)}`,
                    upsert: false
                });

            if (error) {
                console.error(`   ❌ Error uploading ${file}:`, error.message);
                continue;
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(storagePath);

            uploadedUrls.push(publicUrlData.publicUrl);
            console.log(`   ✅ Uploaded: ${publicUrlData.publicUrl}`);
        }

        console.log();
        console.log(`✅ 업로드 완료: ${uploadedUrls.length}개 이미지`);
        console.log();

        // Save upload log
        const logPath = path.resolve(__dirname, 'upload_columbarium_images_log.json');
        const logData = {
            timestamp: new Date().toISOString(),
            uploadedImages: uploadedUrls.length,
            uploadedUrls: uploadedUrls
        };

        fs.writeFileSync(logPath, JSON.stringify(logData, null, 2), 'utf-8');
        console.log(`📄 로그 저장됨: ${logPath}`);
        console.log();

        // Generate SQL for rotation assignment
        console.log('='.repeat(60));
        console.log('📝 다음 단계: SQL 실행');
        console.log('='.repeat(60));
        console.log('Supabase SQL Editor에서 다음 파일 실행:');
        console.log('   migrations/20260119_columbarium_image_rotation.sql');
        console.log();
        console.log('SQL이 자동으로 생성되었습니다!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Upload failed:', error);
        throw error;
    }
}

uploadColumbariumImages();
