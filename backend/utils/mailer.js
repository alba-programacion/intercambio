const nodemailer = require('nodemailer');
const https = require('https');

const host = process.env.EMAIL_HOST ? process.env.EMAIL_HOST.trim() : null;
const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : null;
const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/[\r\n\s]/g, '') : null;
const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT.toString().trim(), 10) : 587;
const secure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE.toString().trim() === 'true' : false;

let transporter = null;
if (host && user) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000
  });
}

const sendBrevoApi = (to, subject, text, html) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.replace(/[\r\n\s]/g, '') : null;
    const fromEmail = (process.env.BREVO_FROM_EMAIL || process.env.EMAIL_USER || 'no-reply@talentcollab.com').toString().trim();
    const fromName = (process.env.BREVO_FROM_NAME || 'TalentCollab').toString().trim();

    const postData = JSON.stringify({
      sender: {
        name: fromName,
        email: fromEmail
      },
      to: [
        {
          email: to
        }
      ],
      subject: subject,
      htmlContent: html,
      textContent: text
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed);
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`Brevo API error: Status ${res.statusCode} - ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
};

const getPremiumEmailTemplate = (contentHtml, link = null) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  let linkButton = '';
  if (link) {
    const fullLink = link.startsWith('http') ? link : `${clientUrl}${link}`;
    linkButton = `
      <div class="btn-container">
        <a href="${fullLink}" class="btn">Ver en la plataforma</a>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación TalentCollab</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #f8fafc;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 36px 32px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px 32px;
      color: #334155;
    }
    .content h2 {
      margin-top: 0;
      color: #0f172a;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 20px;
    }
    .content p {
      font-size: 16px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .btn-container {
      text-align: center;
      margin: 36px 0 12px;
    }
    .btn {
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.25);
      transition: background-color 0.2s ease;
    }
    .btn:hover {
      background-color: #4338ca;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      border-top: 1px solid #f1f5f9;
      text-align: center;
      font-size: 13px;
      color: #64748b;
    }
    .footer p {
      margin: 0 0 8px;
    }
    .footer p:last-child {
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>TalentCollab</h1>
      </div>
      <div class="content">
        <h2>Notificación de la plataforma</h2>
        ${contentHtml}
        ${linkButton}
      </div>
      <div class="footer">
        <p>© 2026 TalentCollab. Todos los derechos reservados.</p>
        <p>Este es un correo automático generado por el sistema. Por favor no respondas a este mensaje.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

const sendEmail = async (to, subject, text, html, link = null) => {
  const brevoKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.replace(/[\r\n\s]/g, '') : null;
  const fromEmail = (process.env.BREVO_FROM_EMAIL || process.env.EMAIL_USER || 'no-reply@talentcollab.com').toString().trim();
  const fromName = (process.env.BREVO_FROM_NAME || 'TalentCollab').toString().trim();

  // Auto-wrap in premium template if it's not a full HTML document
  let finalHtml = html;
  if (html && !html.trim().toLowerCase().startsWith('<!doctype') && !html.trim().toLowerCase().startsWith('<html')) {
    finalHtml = getPremiumEmailTemplate(html, link);
  } else if (!html && text) {
    finalHtml = getPremiumEmailTemplate(`<p>${text}</p>`, link);
  }

  // Choose transport: Brevo API first (to bypass SMTP blocks on platforms like Render Free), SMTP second, Mock third
  if (brevoKey && brevoKey !== 'tu_api_key_de_brevo') {
    try {
      console.log(`[MAILER] Sending email via Brevo API to: ${to}`);
      const result = await sendBrevoApi(to, subject, text, finalHtml);
      console.log(`[MAILER] Brevo email sent successfully to ${to}`);
      return result;
    } catch (error) {
      console.error('[MAILER] Error sending email via Brevo API:', error);
      if (transporter) {
        console.log('[MAILER] Falling back to SMTP...');
      } else {
        throw error;
      }
    }
  }

  if (transporter) {
    try {
      console.log(`[MAILER] Sending email via SMTP to: ${to}`);
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        text,
        html: finalHtml,
      });
      console.log('[MAILER] SMTP Email sent: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('[MAILER] Error sending email via SMTP:', error);
      throw error;
    }
  }

  console.log(`[MAILER MOCK] Skip email (No SMTP or API Key configured).`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Text preview: ${text ? text.substring(0, 100) : ''}`);
  return { messageId: 'mock-id-' + Date.now() };
};

module.exports = { sendEmail };

