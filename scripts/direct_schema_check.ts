import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const dbUrl = process.env.DATABASE_URL;

async function check() {
    const client = new pg.Client({ connectionString: dbUrl });
    await client.connect();

    try {
        const res = await client.query(`
            SELECT 
                column_name, 
                data_type, 
                udt_name
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'reviews'
            ORDER BY ordinal_position;
        `);
        console.log('Columns in reviews:');
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
