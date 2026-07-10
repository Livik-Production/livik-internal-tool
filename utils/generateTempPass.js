// utils/generateTempPass.js
export function generateTempPass(length = 12) {
  const charset =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*()-_=+';
  // length should be at least 8 for decent entropy
  const out = [];
  const values = new Uint32Array(length);
  if (!globalThis.crypto || !crypto.getRandomValues) {
    // fallback to Math.random (very unlikely in modern browsers)
    for (let i = 0; i < length; i++) {
      out.push(charset[Math.floor(Math.random() * charset.length)]);
    }
    return out.join('');
  }
  crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    // modulo bias negligible for typical charset size and length
    out.push(charset[values[i] % charset.length]);
  }
  return out.join('');
}
