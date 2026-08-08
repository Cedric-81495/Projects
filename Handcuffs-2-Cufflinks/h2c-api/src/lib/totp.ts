import crypto from 'node:crypto';

/**
 * TOTP (RFC 6238) over HMAC-SHA1, 6 digits, 30-second steps.
 *
 * Implemented against node:crypto rather than pulled in as a dependency. The
 * algorithm is about forty lines, and an authentication primitive is exactly
 * the kind of thing worth being able to read end to end rather than trusting a
 * transitive dependency tree to stay honest.
 *
 * SHA-1 here is not a weakness. TOTP uses it inside HMAC, where collision
 * resistance is not the property being relied on, and it is what every
 * authenticator app implements. Choosing SHA-256 would be marginally stronger
 * on paper and unusable with half the apps people already have installed.
 */

const DIGITS = 6;
const STEP_SECONDS = 30;
/** Accepted drift either side of now, in steps. One step = 30s, so ±30s. */
const WINDOW = 1;

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];

  // No '=' padding: authenticator apps accept unpadded secrets and padding in
  // an otpauth:// URI only invites URL-encoding mistakes.
  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[=\s-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error('Invalid base32 character in TOTP secret.');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/** 20 random bytes — the SHA-1 block size RFC 4226 recommends. */
export function generateSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

function codeForCounter(secret: Buffer, counter: number): string {
  const buffer = Buffer.alloc(8);
  // Counter is a 64-bit big-endian integer. Split across two 32-bit writes
  // because it comfortably exceeds what a single writeUInt32 holds and
  // BigInt64 would need casting at every call site.
  buffer.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buffer.writeUInt32BE(counter >>> 0, 4);

  const digest = crypto.createHmac('sha1', secret).update(buffer).digest();
  // Dynamic truncation, RFC 4226 §5.4.
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 10 ** DIGITS).padStart(DIGITS, '0');
}

/** Current code. Exported for tests and for the enrolment preview. */
export function generateCode(secretBase32: string, at: number = Date.now()): string {
  const counter = Math.floor(at / 1000 / STEP_SECONDS);
  return codeForCounter(base32Decode(secretBase32), counter);
}

/**
 * Checks a submitted code against the accepted window.
 *
 * Comparison is constant-time. A timing-variable compare on a six-digit code is
 * a real oracle: the search space is small enough that per-digit feedback makes
 * it tractable.
 */
export function verifyCode(secretBase32: string, submitted: string, at: number = Date.now()): boolean {
  const code = submitted.replace(/\s/g, '');
  if (!/^\d{6}$/.test(code)) return false;

  const secret = base32Decode(secretBase32);
  const counter = Math.floor(at / 1000 / STEP_SECONDS);

  let matched = false;
  for (let drift = -WINDOW; drift <= WINDOW; drift += 1) {
    const candidate = codeForCounter(secret, counter + drift);
    // No early return: exiting on the first match would leak, through timing,
    // which step matched, and short-circuiting the loop is not worth that.
    if (crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(code))) matched = true;
  }
  return matched;
}

/**
 * otpauth:// URI for the QR code the CMS renders at enrolment.
 *
 * Both label and issuer are encoded, and the issuer is repeated as a parameter
 * as well as in the label — older apps read one, newer ones read the other, and
 * getting it wrong shows the account as an unlabelled six-digit code.
 */
export function otpauthUri(secret: string, accountEmail: string, issuer = 'Handcuffs 2 Cufflinks'): string {
  const label = encodeURIComponent(`${issuer}:${accountEmail}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/* ------------------------------------------------------------------ */
/* Recovery codes                                                      */
/* ------------------------------------------------------------------ */

/**
 * Ten single-use codes, shown once at enrolment and stored only as hashes.
 *
 * Plain SHA-256 rather than bcrypt, deliberately: these are 40 bits of server
 * generated entropy, not user-chosen passwords, so there is no dictionary to
 * attack and a slow hash would only make the login path slower. The formatting
 * exists so someone can read one off a piece of paper without losing their
 * place.
 */
export function generateRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

export function hashRecoveryCode(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code.replace(/[\s-]/g, '').toUpperCase())
    .digest('hex');
}
