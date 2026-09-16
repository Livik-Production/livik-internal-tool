import 'dotenv/config';
import transporter from '../config/emailConfig.js';

async function main() {
  try {
    console.log('MS_SENDER_EMAIL:', process.env.MS_SENDER_EMAIL);

    const info = await transporter.sendMail({
      to: process.env.MS_SENDER_EMAIL,
      subject: 'LivikTech Test Email',
      text: 'Microsoft Graph mail test successful',
    });

    console.log('✅ Email sent');
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
