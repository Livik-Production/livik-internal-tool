// lib/mailer.ts
import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = parseInt(process.env.SMTP_PORT || '587', 10);
const user = process.env.SMTP_USER || process.env.EMAIL_ID;
const pass = process.env.SMTP_PASS || process.env.GOOGLE_APP_PASSWORD;
const from = process.env.MAIL_FROM || `HR Team <${user || 'hr@example.com'}>`;

// Create Nodemailer transporter
export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // true for 465, false for other ports
  auth: {
    user,
    pass,
  },
});

console.info('[Mailer] Using SMTP', {
  host,
  port,
  user,
  from,               // the exact “From” header
});

/**
 * Sends a personalized HTML birthday email to the specified employee.
 * @param email - The recipient's email address
 * @param name - The recipient's first name / display name
 */
export async function sendBirthdayEmail(
  email: string,
  name: string
): Promise<void> {
  const mailOptions = {
    from,
    to: email,
    subject: `Happy Birthday, ${name}! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Happy Birthday, ${name}!</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #f4f6f8;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 20px;
              text-align: center;
              color: #ffffff;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .content {
              padding: 40px 30px;
              color: #333333;
              line-height: 1.6;
              font-size: 16px;
            }
            .content p {
              margin: 0 0 20px 0;
            }
            .wishes {
              font-size: 18px;
              font-weight: 500;
              color: #4f46e5;
              border-left: 4px solid #4f46e5;
              padding-left: 15px;
              margin: 25px 0;
            }
            .footer {
              padding: 30px;
              background-color: #fafbfc;
              border-top: 1px solid #eaeaea;
              text-align: left;
              font-size: 14px;
              color: #666666;
            }
            .footer p {
              margin: 0;
            }
            .signature {
              font-weight: 600;
              color: #333333;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Happy Birthday, ${name}! 🥳✨</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>On behalf of everyone at the Livik Tech, we want to wish you a very happy birthday!</p>
              <div class="wishes">
                "May your day be filled with joy, laughter, and wonderful memories, and may the coming year bring you success, health, and happiness in all your endeavors."
              </div>
              <p>Thank you for all your hard work, dedication, and the unique energy you bring to our team every single day. We are truly fortunate to have you with us.</p>
            </div>
            <div class="footer">
              <p>Warmest wishes,</p>
              <p class="signature">${from.replace(/s*<.*?>/, '')}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Sends a personalized HTML work anniversary email to the specified employee.
 * @param email - The recipient's email address
 * @param name - The recipient's first name
 * @param yearsCompleted - The number of years completed in the company
 */
export async function sendAnniversaryEmail(email: string, name: string, yearsCompleted: number): Promise<void> {
  const yearsString = yearsCompleted === 1 ? '1 year' : `${yearsCompleted} years`;
  const mailOptions = {
    from,
    to: email,
    subject: `Congratulations on your Work Anniversary, ${name}! 🎊`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Happy Work Anniversary, ${name}!</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #f4f6f8;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            }
            .header {
              background: linear-gradient(135deg, #004475 0%, #0077cc 100%);
              padding: 40px 20px;
              text-align: center;
              color: #ffffff;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .content {
              padding: 40px 30px;
              color: #333333;
              line-height: 1.6;
              font-size: 16px;
            }
            .content p {
              margin: 0 0 20px 0;
            }
            .wishes {
              font-size: 18px;
              font-weight: 500;
              color: #004475;
              border-left: 4px solid #004475;
              padding-left: 15px;
              margin: 25px 0;
            }
            .footer {
              padding: 30px;
              background-color: #fafbfc;
              border-top: 1px solid #eaeaea;
              text-align: left;
              font-size: 14px;
              color: #666666;
            }
            .footer p {
              margin: 0;
            }
            .signature {
              font-weight: 600;
              color: #333333;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Happy Work Anniversary! 🥳✨</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>Heartful congratulations on completing <strong>${yearsString}</strong> with us!</p>
              <div class="wishes">
                "Thank you for being an essential part of our success. Your dedication, hard work, and loyalty over the past year${yearsCompleted > 1 ? 's' : ''} are greatly appreciated."
              </div>
              <p>We are proud to have you on our team and look forward to achieving many more milestones together in the years to come.</p>
            </div>
            <div class="footer">
              <p>Warmest wishes,</p>
              <p class="signature">${from.replace(/s*<.*?>/, '')}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Sends a professional invoice creation reminder email to a super admin.
 * @param email          - The recipient's email address
 * @param adminName      - The recipient's first name
 * @param customerName   - The customer for whom the invoice must be created
 * @param invoiceToDay   - The day-of-month on which the invoice cycle ends
 * @param daysBefore     - How many days before the due date this reminder is sent
 */
export async function sendInvoiceReminderEmail(
  email: string,
  adminName: string,
  customerName: string,
  invoiceToDay: number = 0,
  daysBefore: number = 1
): Promise<void> {
  const dueDayLabel = invoiceToDay
    ? `day ${invoiceToDay} of this month`
    : 'the upcoming due date';
  const urgencyLabel =
    daysBefore === 1
      ? 'tomorrow'
      : `in <strong>${daysBefore} days</strong>`;

  const mailOptions = {
    from,
    to: email,
    subject: `📋 Invoice Reminder — ${customerName} (due ${urgencyLabel.replace(/<[^>]+>/g, '')})`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice Creation Reminder — ${customerName}</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #f1f5f9;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .wrapper {
              padding: 40px 16px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
              border: 1px solid #e2e8f0;
            }
            /* ── Header ── */
            .header {
              background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
              padding: 28px 36px;
              text-align: left;
            }
            .header-badge {
              display: inline-block;
              background: rgba(59,130,246,0.25);
              color: #93c5fd;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 1.2px;
              text-transform: uppercase;
              padding: 4px 10px;
              border-radius: 20px;
              margin-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 22px;
              font-weight: 700;
              color: #ffffff;
              line-height: 1.3;
            }
            .header p {
              margin: 6px 0 0 0;
              font-size: 13px;
              color: #94a3b8;
            }
            /* ── Content ── */
            .content {
              padding: 36px;
              color: #334155;
              line-height: 1.7;
              font-size: 15px;
            }
            .content p {
              margin: 0 0 18px 0;
            }
            /* ── Customer Card ── */
            .customer-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-left: 5px solid #3b82f6;
              border-radius: 8px;
              padding: 20px 24px;
              margin: 24px 0;
            }
            .customer-card .label {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #94a3b8;
              margin-bottom: 6px;
            }
            .customer-card .customer-name {
              font-size: 20px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 14px;
            }
            .info-row {
              display: flex;
              gap: 24px;
              flex-wrap: wrap;
            }
            .info-item {
              flex: 1;
              min-width: 120px;
            }
            .info-item .info-label {
              font-size: 11px;
              color: #94a3b8;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.6px;
              margin-bottom: 2px;
            }
            .info-item .info-value {
              font-size: 14px;
              font-weight: 600;
              color: #334155;
            }
            /* ── Urgency Banner ── */
            .urgency-banner {
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              padding: 16px 20px;
              margin: 0 0 24px 0;
              font-size: 14px;
              color: #1e40af;
              font-weight: 500;
            }
            /* ── CTA ── */
            .cta-text {
              font-size: 14px;
              color: #64748b;
              margin-top: 0;
            }
            /* ── Footer ── */
            .footer {
              padding: 20px 36px;
              background-color: #f8fafc;
              border-top: 1px solid #e2e8f0;
              font-size: 12px;
              color: #94a3b8;
            }
            .footer p { margin: 0; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <!-- Header -->
              <div class="header">
                <div class="header-badge">Invoice Reminder</div>
                <h1>Invoice Creation Alert</h1>
                <p>Automated notification from Livik Tech System</p>
              </div>

              <!-- Content -->
              <div class="content">
                <p>Hello <strong>${adminName}</strong>,</p>
                <p>
                  This is an automated reminder to create an invoice for the following
                  customer. The invoice cycle ends on <strong>${dueDayLabel}</strong>
                  — that is ${urgencyLabel}.
                </p>

                <!-- Customer Card -->
                <div class="customer-card">
                  <div class="label">Customer</div>
                  <div class="customer-name">${customerName}</div>
                  <div class="info-row">
                    <div class="info-item">
                      <div class="info-label">Invoice Due Day</div>
                      <div class="info-value">Day ${invoiceToDay} of month</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">Days Remaining</div>
                      <div class="info-value">${daysBefore} day(s)</div>
                    </div>
                  </div>
                </div>

                <!-- Urgency Banner -->
                <div class="urgency-banner">
                  ⏰ &nbsp;Please create the invoice for <strong>${customerName}</strong>
                  before day <strong>${invoiceToDay}</strong> of this month.
                </div>

                <p class="cta-text">
                  Log in to the Livik Tech portal, navigate to Invoices, and generate
                  the invoice for this customer at your earliest convenience.
                </p>
              </div>

              <!-- Footer -->
              <div class="footer">
                <p>This is an automated message from the Livik Tech Internal System.</p>
                <p>Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}
