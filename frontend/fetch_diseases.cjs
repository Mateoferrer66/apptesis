const https = require('https');

const apiUrl = 'https://tfe-agrovisionpwa.onrender.com/api';

const options = {
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
};

https.get(`${apiUrl}/disease-catalog`, options, (resp) => {
  console.log('Status:', resp.statusCode);
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    console.log(data);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
