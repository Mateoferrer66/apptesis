async function testSyncBulk() {
  const url = 'https://tfe-agrovisionpwa.onrender.com/api/sync/bulk';
  
  const payloads = {
    empty: {
      deviceId: "test-device",
      inspections: [], images: [], observations: [], inferenceResults: [], telemetries: []
    },
    inspectionOnly: {
      deviceId: "test-device",
      inspections: [{
        id: "d9e8c4b2-a1b2-4c3d-8e5f-123456789abc",
        inspectionDate: new Date().toISOString()
      }], images: [], observations: [], inferenceResults: [], telemetries: []
    },
    telemetryOnly: {
      deviceId: "test-device",
      inspections: [], images: [], observations: [], inferenceResults: [],
      telemetries: [{
        id: "d9e8c4b2-a1b2-4c3d-8e5f-123456789abc",
        timestamp: new Date().toISOString(),
        pestType: "broca",
        confidence: 0.95,
        inferenceTimeMs: 120,
        inspectionCount: 1,
        deviceHash: "test-device"
      }]
    }
  };

  for (const [name, payload] of Object.entries(payloads)) {
    console.log(`\nTesting ${name}...`);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      console.log(`Result for ${name}: ${res.status} - ${text}`);
    } catch(e) {
      console.error(`Error for ${name}:`, e.message);
    }
  }
}

testSyncBulk();
