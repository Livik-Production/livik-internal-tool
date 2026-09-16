// Sends mail through Microsoft Graph (app-only, client credentials) instead of SMTP,
// since the tenant's Security Defaults blocks Basic Auth SMTP entirely.
const TENANT_ID = process.env.MS_TENANT_ID;
const CLIENT_ID = process.env.MS_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_CLIENT_SECRET;
const SENDER_EMAIL = process.env.MS_SENDER_EMAIL;

if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET || !SENDER_EMAIL) {
  console.warn(
    'WARNING: MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET or MS_SENDER_EMAIL not set in environment variables. Email sending will fail.'
  );
}

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Failed to get Microsoft Graph token: ${data.error_description || data.error}`
    );
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

function toRecipients(to) {
  const list = Array.isArray(to) ? to : [to];
  return list.filter(Boolean).map((address) => ({
    emailAddress: { address },
  }));
}

// Extracts a bare address from either "user@domain.com" or "Display Name <user@domain.com>".
function extractAddress(value) {
  const match = value && value.match(/<([^>]+)>/);
  return match ? match[1] : value;
}

// Nodemailer-compatible shim so existing callers (transporter.sendMail(options)) don't change.
// Note: Graph app-only sendMail always uses the mailbox's own configured display name —
// the "Display Name" portion of a "Name <email>" `from` is ignored, only the address is used.
async function sendMail({ to, subject, text = '', html = '', from = '' }) {
  const token = await getAccessToken();
  const sender = extractAddress(from) || SENDER_EMAIL;

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject,
          body: {
            contentType: html ? 'HTML' : 'Text',
            content: html || text || '',
          },
          toRecipients: toRecipients(to),
        },
        saveToSentItems: false,
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Graph sendMail failed (${res.status}): ${errBody}`);
  }

  return {
    messageId: null,
    accepted: Array.isArray(to) ? to : [to],
    rejected: [],
  };
}

const transporter = { sendMail };

export default transporter;
