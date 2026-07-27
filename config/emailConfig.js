import nodemailer from 'nodemailer';

const emailId = process.env.EMAIL_ID;
const appPassword = process.env.GOOGLE_APP_PASSWORD;

if (!emailId || !appPassword) {
  console.warn(
    'WARNING: EMAIL_ID or GOOGLE_APP_PASSWORD not set in environment variables. Email sending will fail.'
  );
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: emailId,
    pass: appPassword,
  },
});

export default transporter;
