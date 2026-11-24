import { SignJWT, jwtVerify } from 'jose';

/**
 * Signed session cookie helpers.
 *
 * The `auth_session` cookie holds an HS256 JWT signed with SESSION_SECRET.
 * Anything that is not a valid, unexpired token signed with that secret is
 * treated as "not logged in". There is no unsigned fallback.
 */

export const SESSION_COOKIE = 'auth_session';
export const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours, in seconds

const ALG = 'HS256';
const MIN_SECRET_LENGTH = 32;

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters. ` +
        'Refusing to sign or verify sessions.'
    );
  }
  return new TextEncoder().encode(secret);
}

/** Cookie options for the session cookie. maxAge matches the JWT expiry. */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_MAX_AGE,
};

/**
 * Sign a session payload. Throws if SESSION_SECRET is missing or too short.
 * @param {Record<string, unknown>} payload
 * @returns {Promise<string>} compact JWT
 */
export async function signSession(payload) {
  const key = getKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key);
}

/**
 * Verify a session token. Returns the payload when the signature and expiry
 * are valid, otherwise null. Never throws.
 * @param {string | undefined | null} token
 * @returns {Promise<Record<string, any> | null>}
 */
export async function verifySession(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: [ALG],
    });
    return payload;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('SESSION_SECRET')) {
      console.error(err.message);
    }
    return null;
  }
}
