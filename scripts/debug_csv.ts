
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const dataDir = path.resolve(process.cwd(), 'data');
const file = 'facilities_15774129-2025-12-23서울.csv';

console.log(`Inspecting ${file}...`);
const content = fs.readFileSync(path.join(dataDir, file));

// Normalize content to UTF-8 if possible or just parse
try {
    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
        from_line: 1,
        to_line: 2
    });

    if (records.length > 0) {
        console.log('First Record Keys:', Object.keys(records[0]));
        console.log('First Record Values:', records[0]);
    }
} catch (err) {
    console.error(err);
}
