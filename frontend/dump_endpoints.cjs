const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('swagger_utf8.json', 'utf8').replace(/^\uFEFF/, ''));

console.log('\n\n--- POST /api/sync/bulk ---');
const syncBulk = swagger.paths['/api/sync/bulk']?.['post'];
if (syncBulk) {
  const ref = syncBulk.requestBody?.content?.['application/json']?.schema?.$ref;
  if (ref) {
    const name = ref.split('/').pop();
    const schema = swagger.components.schemas[name];
    console.log('Request:', JSON.stringify(schema, null, 2));
    
    // Resolve nested refs
    if (schema.properties) {
      Object.keys(schema.properties).forEach(prop => {
        const propSchema = schema.properties[prop];
        if (propSchema.items && propSchema.items.$ref) {
          const itemRefName = propSchema.items.$ref.split('/').pop();
          console.log(`\nItems for ${prop}:`, JSON.stringify(swagger.components.schemas[itemRefName], null, 2));
        }
      });
    }
  }
}
