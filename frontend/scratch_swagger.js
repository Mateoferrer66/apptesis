const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('swagger_full.json', 'utf8'));

const printSchema = (ref) => {
  if (!ref) return 'No schema';
  const schemaName = ref.split('/').pop();
  return JSON.stringify(swagger.components.schemas[schemaName], null, 2);
};

const endpoints = [
  { path: '/api/sync/bulk', method: 'post' },
  { path: '/api/Telemetry', method: 'post' },
  { path: '/api/inference-results', method: 'post' },
  { path: '/api/inspections/{inspectionId}/images', method: 'post' }
];

endpoints.forEach(ep => {
  console.log(`\n--- ${ep.method.toUpperCase()} ${ep.path} ---`);
  const op = swagger.paths[ep.path]?.[ep.method];
  if (!op) {
    console.log('Not found');
    return;
  }
  
  const reqBody = op.requestBody?.content?.['application/json']?.schema?.$ref;
  console.log('Request Body Schema:', reqBody ? printSchema(reqBody) : 'None / Not JSON');
});
