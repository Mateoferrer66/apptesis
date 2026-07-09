const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('swagger_utf8.json', 'utf8').replace(/^\uFEFF/, ''));

// Print all paths and methods
Object.keys(swagger.paths).forEach(path => {
  const methods = Object.keys(swagger.paths[path]);
  console.log(`${methods.map(m => m.toUpperCase()).join(', ')} ${path}`);
});

console.log('\n\n--- POST /api/inspections ---');
const inspPost = swagger.paths['/api/inspections']?.['post'];
if (inspPost) {
  const ref = inspPost.requestBody?.content?.['application/json']?.schema?.$ref;
  if (ref) {
    const name = ref.split('/').pop();
    console.log('Request:', JSON.stringify(swagger.components.schemas[name], null, 2));
  }
  console.log('Responses:', JSON.stringify(inspPost.responses, null, 2));
} else {
  console.log('NOT FOUND - checking case-insensitive...');
  const key = Object.keys(swagger.paths).find(k => k.toLowerCase() === '/api/inspections');
  if (key) {
    console.log('Found at:', key);
    console.log('Methods:', Object.keys(swagger.paths[key]));
  }
}

// Check GET inspections
console.log('\n\n--- GET /api/inspections ---');
const inspGet = swagger.paths['/api/inspections']?.['get'];
if (inspGet) {
  console.log('EXISTS');
} else {
  console.log('NOT FOUND');
  // Check all inspection-related paths
  Object.keys(swagger.paths).filter(k => k.toLowerCase().includes('inspection')).forEach(k => {
    console.log(`  ${Object.keys(swagger.paths[k]).map(m=>m.toUpperCase()).join(',')} ${k}`);
  });
}

// Check images endpoint
console.log('\n\n--- POST /api/inspections/{id}/images ---');
const imgPost = swagger.paths['/api/inspections/{inspectionId}/images']?.['post'];
if (imgPost) {
  const ref = imgPost.requestBody?.content?.['application/json']?.schema?.$ref;
  if (ref) {
    const name = ref.split('/').pop();
    console.log('Request:', JSON.stringify(swagger.components.schemas[name], null, 2));
  }
}

// Check inference endpoint
console.log('\n\n--- POST /api/inference-results ---');
const infPost = swagger.paths['/api/inference-results']?.['post'];
if (infPost) {
  const ref = infPost.requestBody?.content?.['application/json']?.schema?.$ref;
  if (ref) {
    const name = ref.split('/').pop();
    console.log('Request:', JSON.stringify(swagger.components.schemas[name], null, 2));
  }
}
