import crypto from 'node:crypto';

/**
 * Time-based one-time codes for the Studio's second sign-in step
 * (RFC 6238: HMAC-SHA1, 30-second steps, 6 digits, which is what every
 * authenticator app uses). Built on node:crypto rather than a dependency:
 * the algorithm is a dozen lines, and a sign-in library is exactly the kind
 * of package a supply-chain attack aims for.
 *
 * The secret is stored encrypted (AES-256-GCM). The key is derived from
 * JWT_SECRET with HKDF, so no new environment variable is needed; changing
 * JWT_SECRET therefore invalidates the stored secret, and
 * scripts/resetTwoFactor.js turns two-step sign-in off so it can be set up
 * again.
 */

const STEP_SECONDS = 30;
const DIGITS = 6;
/** Accept the previous and next step too: phone clocks drift. */
const DRIFT_STEPS = 1;
const ISSUER = 'The Shutter Bug';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text) {
  const clean = String(text).toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    value = (value << 5) | BASE32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** A new 160-bit secret, base32 (what authenticator apps take). */
export function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function codeAt(secret, step) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const mac = crypto.createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const offset = mac[mac.length - 1] & 15;
  const n = (mac.readUInt32BE(offset) & 0x7fffffff) % 10 ** DIGITS;
  return String(n).padStart(DIGITS, '0');
}

export function currentStep(now = Date.now()) {
  return Math.floor(now / 1000 / STEP_SECONDS);
}

/**
 * The step a code matches, or null. A step at or before `lastUsedStep` is
 * refused, so a code can't be used twice (someone watching over a shoulder
 * can't replay it within its 30 seconds).
 */
export function verifyCode(secret, code, lastUsedStep = -1, now = Date.now()) {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return null;
  const step = currentStep(now);
  const given = Buffer.from(code);
  for (let s = step - DRIFT_STEPS; s <= step + DRIFT_STEPS; s++) {
    if (s <= lastUsedStep) continue;
    if (crypto.timingSafeEqual(given, Buffer.from(codeAt(secret, s)))) return s;
  }
  return null;
}

/** For the QR code: otpauth://totp/Issuer:email?secret=…&issuer=… */
export function otpauthUrl(secret, account) {
  const label = encodeURIComponent(`${ISSUER}:${account}`);
  const params = new URLSearchParams({ secret, issuer: ISSUER, algorithm: 'SHA1', digits: String(DIGITS), period: String(STEP_SECONDS) });
  return `otpauth://totp/${label}?${params}`;
}

// ── Encryption at rest ──────────────────────────────────────────────────────

function key() {
  return Buffer.from(
    crypto.hkdfSync('sha256', process.env.JWT_SECRET, Buffer.alloc(0), 'shutterbug totp secret v1', 32)
  );
}

/** "v1.<iv>.<tag>.<ciphertext>", base64url. */
export function sealSecret(secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return ['v1', iv, cipher.getAuthTag(), data].map((p) => (typeof p === 'string' ? p : p.toString('base64url'))).join('.');
}

/** The secret, or null if it can't be opened (tampered, or JWT_SECRET changed). */
export function openSecret(sealed) {
  try {
    const [v, iv, tag, data] = String(sealed).split('.');
    if (v !== 'v1') return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

// ── Recovery codes ──────────────────────────────────────────────────────────

const RECOVERY_COUNT = 10;

/** "XXXXX-XXXXX" from the base32 alphabet: 50 random bits each. */
export function generateRecoveryCodes() {
  return Array.from({ length: RECOVERY_COUNT }, () => {
    const s = base32Encode(crypto.randomBytes(7)).slice(0, 10);
    return `${s.slice(0, 5)}-${s.slice(5)}`;
  });
}

export function normalizeRecoveryCode(code) {
  return String(code).toUpperCase().replace(/[^A-Z2-7]/g, '');
}

/** Stored as SHA-256 hashes: high-entropy, single-use, rate-limited. */
export function hashRecoveryCode(code) {
  return crypto.createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex');
}

export function looksLikeRecoveryCode(code) {
  return typeof code === 'string' && normalizeRecoveryCode(code).length === 10;
}
