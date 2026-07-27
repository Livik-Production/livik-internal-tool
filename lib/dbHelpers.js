// lib/dbHelpers.js
import { prisma } from './prisma.js';

/**
 * isTransientError(err) -> boolean
 * Tight heuristic: check Prisma error codes and message substrings.
 */
function isTransientError(err) {
  if (!err) return false;
  const code = err.code || '';
  const msg = (err.message || '').toString();
  // Prisma connection errors and network closed cases
  if (code === 'P1001' || code === 'P2026' || code === 'XX000') return true; // can't reach DB / connection lost
  // Generic check for Closed / terminated / connection refused
  if (
    msg.includes('Closed') ||
    msg.includes('Connection terminated') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('timed out') ||
    msg.includes('Control plane request failed')
  ) {
    return true;
  }
  return false;
}

/**
 * safeExecute(fn, opts)
 * - fn(prisma) should return a Promise of DB operation
 * - opts: { retries = 2, initialDelay = 150 }  -> retry attempts on transient errors
 */
export async function safeExecute(fn, opts = {}) {
  const { retries = 5, initialDelay = 300 } = opts;
  let attempt = 0;
  let lastErr;

  while (attempt <= retries) {
    try {
      // If attempt > 0, ensure prisma is connected before trying
      if (attempt > 0) {
        try {
          // ensure connected; if already connected this is a no-op
          await prisma.$connect();
        } catch (connErr) {
          // swallow connect errors; will be handled below as lastErr
          console.warn(
            '[safeExecute] prisma.$connect() failed:',
            connErr?.message ?? connErr
          );
        }
      }

      // run provided function
      return await fn(prisma);
    } catch (err) {
      lastErr = err;
      if (!isTransientError(err)) {
        // non-transient: bail out immediately
        throw err;
      }

      // transient: log + backoff + retry
      const delay = initialDelay * Math.pow(2, attempt); // exponential backoff

      console.warn(
        `[safeExecute] transient DB error (attempt ${attempt}): ${
          err?.message || err
        }. retrying in ${delay}ms`
      );
      await new Promise((r) => setTimeout(r, delay));
      attempt += 1;
      continue;
    }
  }

  // if we reach here, all attempts exhausted
  // attach info and rethrow lastErr
  console.error(
    '[safeExecute] exhausted retries, rethrowing error:',
    lastErr?.message ?? lastErr
  );
  throw lastErr;
}
