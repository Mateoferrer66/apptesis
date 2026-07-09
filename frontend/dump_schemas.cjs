const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('swagger_utf8.json', 'utf8').replace(/^\uFEFF/, ''));

const printSchema = (schemaName) => {
  return JSON.stringify(swagger.components.schemas[schemaName], null, 2);
};

console.log('--- SyncBulkRequestDto ---');
console.log(printSchema('SyncBulkRequestDto'));
console.log('\n--- CreateInferenceResultRequestDto ---');
console.log(printSchema('CreateInferenceResultRequestDto'));
console.log('\n--- SyncTelemetryDto ---'); // Let's guess the schema name for telemetry
// Find Telemetry schema
const telemetrySchema = Object.keys(swagger.components.schemas).find(k => k.toLowerCase().includes('telemetry'));
if (telemetrySchema) {
  console.log(`\n--- ${telemetrySchema} ---`);
  console.log(printSchema(telemetrySchema));
}

// Find Image schema
const imageSchema = Object.keys(swagger.components.schemas).find(k => k.toLowerCase().includes('image'));
if (imageSchema) {
  console.log(`\n--- ${imageSchema} ---`);
  console.log(printSchema(imageSchema));
}
