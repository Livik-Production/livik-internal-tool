import 'dotenv/config';
import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = parseInt(process.env.SMTP_PORT || '587', 10);
const user = process.env.SMTP_USER || process.env.EMAIL_ID;
const pass = process.env.SMTP_PASS || process.env.GOOGLE_APP_PASSWORD;
const from = process.env.MAIL_FROM || `HR Team <${user || 'hr@example.com'}>`;

console.log('--- SMTP Config ---');
console.log('Host:', host);
console.log('Port:', port);
console.log('User:', user);
console.log('Pass:', pass ? '********' : 'NOT SET');
console.log('From:', from);
console.log('-------------------');

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log('✅ SMTP connection verified!');
  
  const testTo = process.env.EMAIL_ID || user;
  console.log(`\nSending test invoice reminder email to: ${testTo}`);
  
  const info = await transporter.sendMail({
    from,
    to: testTo,
    subject: `Invoice Reminder: Test Customer 📋`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:40px auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <div style="background:#0f172a;padding:24px 32px;color:#fff;">
          <h1 style="margin:0;font-size:20px;">Invoice Reminder</h1>
        </div>
        <div style="padding:32px;color:#334155;font-size:15px;line-height:1.6;">
          <p>Hello Admin,</p>
          <p>This is an automated reminder that the invoice cycle for one of your customers is due today.</p>
          <div style="background:#f8fafc;border-left:4px solid #3b82f6;padding:16px;margin:24px 0;color:#1e293b;font-weight:500;">
            Customer: <strong>Test Customer</strong>
          </div>
          <p>Please review their account and take any necessary invoicing actions.</p>
        </div>
        <div style="padding:24px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;">
          <p style="margin:0;">Livik Tech Automated Notification System</p>
        </div>
      </div>
    `,
  });
  
  console.log('✅ Email sent successfully!');
  console.log('Message ID:', info.messageId);
  console.log('Response:', info.response);
  console.log('Accepted:', info.accepted);
  console.log('Rejected:', info.rejected);
} catch (err) {
  console.error('❌ Failed:', err.message);
}
