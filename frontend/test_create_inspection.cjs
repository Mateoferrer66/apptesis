const https = require('https');

const apiUrl = 'https://tfe-agrovisionpwa.onrender.com/api';

const payload = {
  inspectionDate: new Date().toISOString(),
  plotId: "00000000-0000-0000-0000-000000000000" // using empty Guid or valid Guid
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

const req = https.request(`${apiUrl}/inspections`, options, (resp) => {
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
