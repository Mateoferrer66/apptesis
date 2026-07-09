const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('swagger_utf8.json', 'utf8').replace(/^\uFEFF/, ''));

const printSchema = (schemaName) => {
  return JSON.stringify(swagger.components.schemas[schemaName], null, 2);
};

[
  'SyncInspectionDto',
  'SyncImageDto',
  'SyncObservationDto',
  'SyncInferenceResultDto',
  'SyncTelemetryDto'
].forEach(name => {
  console.log(`\n--- ${name} ---`);
  console.log(printSchema(name));
});
