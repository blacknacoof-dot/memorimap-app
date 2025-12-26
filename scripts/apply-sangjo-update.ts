
import * as fs from 'fs';
import * as path from 'path';

const constantsPath = path.resolve(process.cwd(), 'constants.ts');
const dataPath = path.resolve(process.cwd(), 'data/sangjo_enriched.json');

const rawData = fs.readFileSync(dataPath, 'utf-8');
const enrichedData = JSON.parse(rawData);

// Convert JSON to TS Array String
let tsContent = 'export const FUNERAL_COMPANIES: FuneralCompany[] = [\n';
enrichedData.forEach((company: any, index: number) => {
    tsContent += `  {\n`;
    tsContent += `    id: '${company.id}',\n`;
    tsContent += `    name: '${company.name}',\n`;
    tsContent += `    rating: ${company.rating},\n`;
    tsContent += `    reviewCount: ${company.reviewCount},\n`;
    tsContent += `    imageUrl: '${company.imageUrl}',\n`;
    tsContent += `    description: '${company.description}',\n`;
    tsContent += `    features: ${JSON.stringify(company.features)},\n`;
    tsContent += `    phone: '${company.phone}',\n`;
    tsContent += `    priceRange: '${company.priceRange}',\n`;
    tsContent += `    benefits: ${JSON.stringify(company.benefits)}\n`;
    tsContent += `  }${index < enrichedData.length - 1 ? ',' : ''}\n`;
});
tsContent += '];';

// Read existing constants.ts
let constantsParams = fs.readFileSync(constantsPath, 'utf-8');

// Regex to replace FUNERAL_COMPANIES block
// Looking for "export const FUNERAL_COMPANIES: FuneralCompany[] = [" until "];"
const regex = /export const FUNERAL_COMPANIES: FuneralCompany\[\] = \[[\s\S]*?\];/;

if (regex.test(constantsParams)) {
    constantsParams = constantsParams.replace(regex, tsContent);
    fs.writeFileSync(constantsPath, constantsParams, 'utf-8');
    console.log("✅ constants.ts updated successfully with 46 companies.");
} else {
    console.error("❌ Could not find FUNERAL_COMPANIES block in constants.ts");
}
