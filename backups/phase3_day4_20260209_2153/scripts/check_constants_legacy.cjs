const fs = require('fs');
const content = fs.readFileSync('c:/Users/black/Desktop/memorimap/constants.ts', 'utf8');
const legacyIds = content.match(/fc(_new)?_\d+/g);
console.log('Legacy IDs found in constants.ts:', legacyIds ? [...new Set(legacyIds)] : 'None');
