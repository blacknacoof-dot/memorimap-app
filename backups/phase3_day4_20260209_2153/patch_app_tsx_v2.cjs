const fs = require('fs');
const filePath = 'c:/Users/black/Desktop/memorimap/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Loosen isBadUrl filter using regex
const isBadUrlRegex = /const isBadUrl = \(url: string\) => \{[\s\S]*?const badPatterns = \[([\s\S]*?)\];[\s\S]*?return badPatterns\.some\(pattern => url\.toLowerCase\(\)\.includes\(pattern\)\);[\s\S]*?\};/;

if (isBadUrlRegex.test(content)) {
    content = content.replace(isBadUrlRegex, `const isBadUrl = (url: string) => {
              if (!url) return true;
              const badPatterns = [
                'placeholder', 'placehold.it', 'placehold.co',
                // 'unsplash', // [RESTORED]
                'mediahub.seoul.go.kr',
                'noimage', 'no-image', 'guitar',
                '_random', '/defaults/'
              ];
              return badPatterns.some(pattern => url.toLowerCase().includes(pattern));
            };`);
    console.log('✅ isBadUrl filter loosened via regex.');
} else {
    console.error('❌ Could not find isBadUrl block via regex.');
}

// 2. Update object return mapping using regex
const returnBlockRegex = /rating: simulatedRating,[\s\r\n]*reviewCount: simulatedReviewCount,/;
if (returnBlockRegex.test(content)) {
    content = content.replace(returnBlockRegex, `rating: ratingValue,
              reviewCount: reviewCountValue,`);
    console.log('✅ Return object mapping updated via regex.');
} else {
    console.error('❌ Could not find return object mapping block via regex.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('🚀 App.tsx patching (v2) complete.');
