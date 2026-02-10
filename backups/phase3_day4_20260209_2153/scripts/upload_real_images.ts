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

const IMAGE_DIR = path.resolve(__dirname, '../data/장례식장 대표이미지_최적화');
const BUCKET_NAME = 'facility-images';
const FOLDER_PREFIX = 'funeral_real';

async function uploadRealImages() {
    console.log('='.repeat(60));
    console.log('🖼️  실제 장례식장 이미지 업로드 (Real Funeral Home Images Upload)');
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
            throw new Error('No image files found in directory!');
        }

        // 2. Upload images to Supabase Storage
        console.log('📤 Supabase Storage에 업로드 중...');
        const uploadedUrls: string[] = [];

        for (const [index, file] of files.entries()) {
            const filePath = path.join(IMAGE_DIR, file);
            const fileBuffer = fs.readFileSync(filePath);
            const ext = path.extname(file);
            const timestamp = Date.now();
            const storagePath = `${FOLDER_PREFIX}/funeral_real_${index + 1}_${timestamp}${ext}`;

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

        // 3. Get facilities with default images
        const DEFAULT_IMAGE_PATTERN = 'xvmpvzldezpoxxsarizm.supabase.co/storage';
        const { data: facilities, error: fetchError } = await supabase
            .from('facilities')
            .select('id, name, images')
            .eq('category', 'funeral_home');

        if (fetchError) {
            throw new Error(`Failed to fetch facilities: ${fetchError.message}`);
        }

        const defaultImageFacilities = facilities.filter(f => {
            if (!f.images || f.images.length === 0) return true; // Include facilities with no images
            const imagesStr = JSON.stringify(f.images || []);
            // Only target images in /defaults/ folder
            return imagesStr.includes('/defaults/charnel_') || imagesStr.includes('/defaults/funeral_');
        });

        console.log(`📊 대상 시설: ${defaultImageFacilities.length}개`);
        console.log();

        // 4. Update facilities with random selection of real images
        console.log('🔄 시설별 이미지 할당 중...');
        let updateCount = 0;
        let errorCount = 0;

        for (const facility of defaultImageFacilities) {
            // Randomly select 3 images
            const shuffled = [...uploadedUrls].sort(() => Math.random() - 0.5);
            const selectedImages = shuffled.slice(0, Math.min(3, uploadedUrls.length));

            const { error: updateError } = await supabase
                .from('facilities')
                .update({
                    images: selectedImages,
                    updated_at: new Date().toISOString()
                })
                .eq('id', facility.id);

            if (updateError) {
                console.error(`   ❌ Error updating ${facility.name}:`, updateError.message);
                errorCount++;
            } else {
                updateCount++;
                if (updateCount % 50 === 0) {
                    console.log(`   ✅ ${updateCount}/${defaultImageFacilities.length} 완료`);
                }
            }
        }

        console.log();
        console.log('='.repeat(60));
        console.log('🎉 작업 완료 (Complete)');
        console.log('='.repeat(60));
        console.log(`✅ 업로드된 이미지: ${uploadedUrls.length}개`);
        console.log(`✅ 업데이트된 시설: ${updateCount}개`);
        console.log(`❌ 실패한 시설: ${errorCount}개`);
        console.log();

        // Save upload log
        const logPath = path.resolve(__dirname, 'upload_real_images_log.json');
        const logData = {
            timestamp: new Date().toISOString(),
            uploadedImages: uploadedUrls.length,
            uploadedUrls: uploadedUrls,
            updatedFacilities: updateCount,
            failedUpdates: errorCount
        };

        fs.writeFileSync(logPath, JSON.stringify(logData, null, 2), 'utf-8');
        console.log(`📄 로그 저장됨: ${logPath}`);
        console.log();

    } catch (error) {
        console.error('❌ Upload failed:', error);
        throw error;
    }
}

uploadRealImages();
