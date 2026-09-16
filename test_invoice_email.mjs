import 'dotenv/config';
import transporter from './config/emailConfig.js';

const from = process.env.MAIL_FROM || `HR Team <${process.env.MS_SENDER_EMAIL || 'noreply@liviktech.com'}>`;

console.log('--- Microsoft Graph Mail Config ---');
console.log('MS_SENDER_EMAIL:', process.env.MS_SENDER_EMAIL);
console.log('MS_TENANT_ID:', process.env.MS_TENANT_ID ? 'SET' : 'NOT SET');
console.log('MS_CLIENT_ID:', process.env.MS_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('MS_CLIENT_SECRET:', process.env.MS_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('From:', from);
console.log('-----------------------------------');

try {
  const testTo = process.env.MS_SENDER_EMAIL;
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
  console.log('Accepted:', info.accepted);
  console.log('Rejected:', info.rejected);
} catch (err) {
  console.error('❌ Failed:', err.message);
}
