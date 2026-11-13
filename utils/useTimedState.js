import { useState, useEffect } from 'react';

const DEFAULT_TTL_MS = 30 * 60 * 1000; // keep filters for 30 minutes

function readStored(key, initial, ttl) {
  try {
    if (typeof window === 'undefined') return initial;
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return initial;
    const { v, t } = JSON.parse(raw);
    if (Date.now() - t > ttl) {
      window.sessionStorage.removeItem(key);
      return initial;
    }
    return v;
  } catch {
    return initial;
  }
}

/**
 * useState that survives unmount/remount (e.g. switching tabs) for a limited
 * time. Stored in sessionStorage, so it is also cleared when the browser tab
 * closes.
 */
export default function useTimedState(key, initial, ttl = DEFAULT_TTL_MS) {
  const [value, setValue] = useState(() => readStored(key, initial, ttl));

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        key,
        JSON.stringify({ v: value, t: Date.now() })
      );
    } catch {
      /* storage unavailable - ignore */
    }
  }, [key, value]);

  return [value, setValue];
}
