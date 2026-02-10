
import * as fs from 'fs';
import * as path from 'path';

const constantsPath = path.resolve(process.cwd(), 'constants.ts');
const dataPath = path.resolve(process.cwd(), 'data/pet_sangjo_enriched.json');

const rawData = fs.readFileSync(dataPath, 'utf-8');
const enrichedData = JSON.parse(rawData);

// Convert JSON to TS Array String
let tsContent = '\n\nexport const PET_FUNERAL_COMPANIES: FuneralCompany[] = [\n';
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
tsContent += '];\n';

// Append to constants.ts
const currentContent = fs.readFileSync(constantsPath, 'utf-8');
if (!currentContent.includes('PET_FUNERAL_COMPANIES')) {
    fs.appendFileSync(constantsPath, tsContent, 'utf-8');
    console.log("✅ Appended PET_FUNERAL_COMPANIES to constants.ts");
} else {
    console.log("ℹ️ PET_FUNERAL_COMPANIES already exists. Skipping append.");
}
