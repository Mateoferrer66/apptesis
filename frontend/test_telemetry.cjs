const https = require('https');

const apiUrl = 'https://tfe-agrovisionpwa.onrender.com/api';

const payload = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  timestamp: new Date().toISOString(),
  pestType: "Broca del Café",
  confidence: 0.9,
  inferenceTimeMs: 100,
  inspectionCount: 1,
  deviceHash: "abc"
};

const dataStr = JSON.stringify(payload);

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(dataStr),
    'ngrok-skip-browser-warning': 'true'
  }
};

const req = https.request(`${apiUrl}/Telemetry`, options, (resp) => {
  console.log('Status:', resp.statusCode);
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    console.log(data);
  });
});

req.on("error", (err) => {
  console.log("Error: " + err.message);
});

req.write(dataStr);
req.end();
