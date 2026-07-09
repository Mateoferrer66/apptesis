const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('swagger_utf8.json', 'utf8').replace(/^\uFEFF/, ''));
console.log(JSON.stringify(swagger.paths['/api/inspections/{inspectionId}/images']['post'], null, 2));
