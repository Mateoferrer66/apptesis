const fs = require('fs');

let content = fs.readFileSync('swagger_utf8.json', 'utf8');
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}
const swagger = JSON.parse(content);

const endpoints = [
  { path: '/api/Telemetry', method: 'post' }
];

endpoints.forEach(ep => {
  console.log(`\n--- ${ep.method.toUpperCase()} ${ep.path} ---`);
  let op = swagger.paths[ep.path]?.[ep.method];
  if (!op) {
    const p = Object.keys(swagger.paths).find(k => k.toLowerCase() === ep.path.toLowerCase());
    if (p) op = swagger.paths[p][ep.method];
  }

  if (!op) {
    console.log('Not found');
    return;
  }
  
  console.log(JSON.stringify(op, null, 2));
});
