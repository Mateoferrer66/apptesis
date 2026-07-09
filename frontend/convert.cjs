const fs = require('fs');
const content = fs.readFileSync('swagger_full.json', 'utf16le');
fs.writeFileSync('swagger_utf8.json', content, 'utf8');
