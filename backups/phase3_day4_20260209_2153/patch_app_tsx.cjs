const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/black/Desktop/memorimap/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Restore real ratings and review counts
// Replace the simulation logic block
const simulationBlockRegex = /\/\/ Improved Randomization Logic[\s\S]*?const simulatedReviewCount = 3 \+ \(idNum % 6\);/;
const simulationReplacement = `// 🛡️ [RESTORATION] Use real ratings and review counts from DB
            const ratingValue = item.rating ? Number(item.rating) : 0;
            const reviewCountValue = item.review_count ? Number(item.review_count) : 0;`;

if (simulationBlockRegex.test(content)) {
    content = content.replace(simulationBlockRegex, simulationReplacement);
    console.log('✅ Simulation block replaced.');
} else {
    console.error('❌ Could not find simulation block.');
}

// 2. Loosen image filters (allow Unsplash)
const isBadUrlOld = `const isBadUrl = (url: string) => {
              if (!url) return true;
              const badPatterns = [
                'placeholder', 'placehold.it', 'placehold.co',
                'unsplash',
                'mediahub.seoul.go.kr',
                'noimage', 'no-image', 'guitar',
                '_random', '/defaults/' // [FIX] These are our placeholders, not real facility photos
              ];
              return badPatterns.some(pattern => url.toLowerCase().includes(pattern));
            };`;

const isBadUrlNew = `const isBadUrl = (url: string) => {
              if (!url) return true;
              const badPatterns = [
                'placeholder', 'placehold.it', 'placehold.co',
                // 'unsplash', // [RESTORED]
                'mediahub.seoul.go.kr',
                'noimage', 'no-image', 'guitar',
                '_random', '/defaults/'
              ];
              return badPatterns.some(pattern => url.toLowerCase().includes(pattern));
            };`;

if (content.includes(isBadUrlOld)) {
    content = content.replace(isBadUrlOld, isBadUrlNew);
    console.log('✅ isBadUrl filter loosened.');
} else {
    // Try without the exact comments if it fails
    console.error('❌ Could not find isBadUrl block with exact match.');
}

// 3. Update the returned object mapping
const returnBlockOld = `rating: simulatedRating,
              reviewCount: simulatedReviewCount,`;
const returnBlockNew = `rating: ratingValue,
              reviewCount: reviewCountValue,`;

if (content.includes(returnBlockOld)) {
    content = content.replace(returnBlockOld, returnBlockNew);
    console.log('✅ Return object mapping updated.');
} else {
    console.error('❌ Could not find return object mapping block.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('🚀 App.tsx patching complete.');
