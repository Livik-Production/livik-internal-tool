async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/asset-assignment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId: 'test-asset-id', 
        employeeId: '',
        assignedDate: '2026-06-26',
        notes: 'Test',
        assignmentType: 'LOCATION',
        locationId: 'test-location-id',
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
