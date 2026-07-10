import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_ID,
    pass: process.env.SMTP_PASS || process.env.GOOGLE_APP_PASSWORD,
  },
});

async function main() {
  try {
    console.log('EMAIL:', process.env.EMAIL_ID);

    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const info = await transporter.sendMail({
      from: process.env.EMAIL_ID,
      to: process.env.EMAIL_ID,
      subject: 'LivikTech Test Email',
      text: 'SMTP test successful',
    });

    console.log('✅ Email sent');
    console.log('Message ID:', info.messageId);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
    console.log('Response:', info.response);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();