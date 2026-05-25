const fs = require('fs');
const path = require('path');

async function run() {
  const url = 'https://intercambio-back.onrender.com/api/cvs/vacancy';
  
  // Create a dummy pdf file
  const filePath = path.join(__dirname, 'dummy.pdf');
  fs.writeFileSync(filePath, '%PDF-1.4 dummy contents');
  
  // Create FormData manually since we are using Node.js fetch
  const formData = new FormData();
  formData.append('name', 'Maria Test');
  formData.append('email', 'maria.test@example.com');
  formData.append('targetVacancyId', '69e655785400186531c98cf1'); // Let's check a valid vacancy ID or just use a dummy
  formData.append('sourceInstitutionId', 'A');
  
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });
  formData.append('document', blob, 'dummy.pdf');

  console.log('Sending request to Render...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });
    console.log('Response status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  } finally {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

run();
