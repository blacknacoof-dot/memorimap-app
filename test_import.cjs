
try {
    const queries = require('./lib/queries');
    console.log('Successfully imported queries.ts');
    console.log('Exported keys:', Object.keys(queries));
} catch (e) {
    console.error('Failed to import queries.ts:', e);
}
