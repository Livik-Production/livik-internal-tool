import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import { signSession, verifySession, SESSION_MAX_AGE } from '../lib/session';

const SECRET = 'test-secret-that-is-definitely-longer-than-32-chars';
const OTHER_SECRET = 'a-completely-different-secret-also-over-32-chars';
const enc = (s) => new TextEncoder().encode(s);

const payload = {
  employeeId: 'emp_123',
  roleName: 'EMPLOYEE',
  rights: ['view_main_dashboard'],
};

describe('lib/session', () => {
  let originalSecret;

  beforeEach(() => {
    originalSecret = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalSecret;
  });

  it('round-trips a signed session', async () => {
    const token = await signSession(payload);
    const result = await verifySession(token);

    expect(result).toMatchObject(payload);
    expect(typeof result.iat).toBe('number');
    expect(result.exp - result.iat).toBe(SESSION_MAX_AGE);
  });

  it('rejects a forged plain-JSON cookie', async () => {
    expect(await verifySession('{"roleName":"Admin"}')).toBeNull();
    expect(await verifySession(JSON.stringify(payload))).toBeNull();
  });

  it('rejects a token whose payload was modified', async () => {
    const token = await signSession(payload);
    const [header, , signature] = token.split('.');
    const forgedBody = Buffer.from(
      JSON.stringify({ ...payload, roleName: 'SUPER_ADMIN' })
    ).toString('base64url');

    expect(await verifySession(`${header}.${forgedBody}.${signature}`)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const now = Math.floor(Date.now() / 1000);
    const expired = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now - 2 * SESSION_MAX_AGE)
      .setExpirationTime(now - 60)
      .sign(enc(SECRET));

    expect(await verifySession(expired)).toBeNull();
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(enc(OTHER_SECRET));

    expect(await verifySession(token)).toBeNull();
  });

  it('rejects empty and malformed input without throwing', async () => {
    for (const bad of [undefined, null, '', 'not-a-jwt', 'a.b.c', 123]) {
      expect(await verifySession(bad)).toBeNull();
    }
  });

  it('fails closed when SESSION_SECRET is missing or too short', async () => {
    const token = await signSession(payload);

    delete process.env.SESSION_SECRET;
    await expect(signSession(payload)).rejects.toThrow(/SESSION_SECRET/);
    expect(await verifySession(token)).toBeNull();

    process.env.SESSION_SECRET = 'too-short';
    await expect(signSession(payload)).rejects.toThrow(/SESSION_SECRET/);
    expect(await verifySession(token)).toBeNull();
  });
});
