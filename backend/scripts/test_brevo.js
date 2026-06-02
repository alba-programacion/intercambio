require('dotenv').config();
const { sendEmail } = require('../utils/mailer');

async function run() {
  console.log('Testing Brevo Email Service Integration...');
  console.log('Environment configuration:');
  console.log('- BREVO_API_KEY:', process.env.BREVO_API_KEY ? (process.env.BREVO_API_KEY === 'tu_api_key_de_brevo' ? 'PLACEHOLDER' : 'CONFIGURED') : 'NOT CONFIGURED');
  console.log('- BREVO_FROM_EMAIL:', process.env.BREVO_FROM_EMAIL || 'NOT CONFIGURED');
  console.log('- EMAIL_HOST:', process.env.EMAIL_HOST || 'NOT CONFIGURED');
  console.log('- EMAIL_USER:', process.env.EMAIL_USER || 'NOT CONFIGURED');

  const testEmail = process.env.TEST_RECIPIENT_EMAIL || 'test@example.com';
  console.log(`Sending a test email to: ${testEmail}...`);

  try {
    const result = await sendEmail(
      testEmail,
      'Test de Integración TalentCollab (Brevo)',
      'Este es un correo de prueba del sistema de notificaciones migrado a Brevo.',
      '<p>Este es un correo de prueba del sistema de notificaciones.</p><p>La integración con <strong>Brevo API</strong> funciona correctamente.</p>',
      '/tareas'
    );
    console.log('Send result:', result);
    console.log('Test completed.');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

run();
