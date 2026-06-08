fetch('http://localhost:3000/api/hr/payslip', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    employeeId: 'cla2qngq3000kmtk0i5xszs1g', // Valid CUID
    month: 'February',
    year: 2026,
  }),
})
  .then((res) =>
    res.json().then((data) => ({ status: res.status, body: data }))
  )
  .then(({ status, body }) => {})
  .catch((err) => console.error('Fetch error:', err));
