import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    console.log('--- Keys found in .env.local ---');
    envContent.split('\n').forEach(line => {
        const [key] = line.split('=');
        if (key && key.trim()) {
            console.log(key.trim());
        }
    });
} else {
    console.log('.env.local not found');
}
