import crypto from 'crypto';
import { logger } from '../utils/logger.js';

// Generate ephemeral per-process secrets ONLY if environment variables are missing,
// ensuring zero hardcoded secret literals exist in source control.
const createRuntimeSecret = (envVarName) => {
  const val = process.env[envVarName];
  if (val && val.trim().length >= 16) {
    return val.trim();
  }
  const generated = crypto.randomBytes(48).toString('hex');
  if (process.env.NODE_ENV === 'production') {
    logger.error(
      `SECURITY WARNING: ${envVarName} is missing or too short in production. Generated an ephemeral runtime secret; configure ${envVarName} in environment settings.`
    );
  } else {
    logger.warn(
      `${envVarName} not set or weak; using ephemeral runtime secret for this process.`
    );
  }
  return generated;
};

export const securityConfig = {
  jwtSecret: createRuntimeSecret('JWT_SECRET'),
  jwtRefreshSecret: createRuntimeSecret('JWT_REFRESH_SECRET'),
  cookieSecret: createRuntimeSecret('COOKIE_SECRET'),
  get qrHmacSecret() {
    if (process.env.QR_HMAC_SECRET && process.env.QR_HMAC_SECRET.trim().length >= 16) {
      return process.env.QR_HMAC_SECRET.trim();
    }
    return this.jwtSecret;
  }
};

// In-memory revocation tracking for refresh tokens & user logout cutoffs
const revokedRefreshJtis = new Map(); // jti -> expiresAtMs
const userLogoutCutoffSec = new Map(); // userId -> unixTimestampSec

const pruneRevokedTokens = () => {
  const now = Date.now();
  for (const [jti, expMs] of revokedRefreshJtis.entries()) {
    if (expMs <= now) {
      revokedRefreshJtis.delete(jti);
    }
  }
};

export const revokeRefreshJti = (jti, ttlMs = 7 * 24 * 60 * 60 * 1000) => {
  if (!jti) return;
  pruneRevokedTokens();
  revokedRefreshJtis.set(jti, Date.now() + ttlMs);
};

export const isRefreshJtiRevoked = (jti) => {
  if (!jti) return false;
  pruneRevokedTokens();
  const expMs = revokedRefreshJtis.get(jti);
  return Boolean(expMs && expMs > Date.now());
};

export const recordUserLogout = (userId) => {
  if (!userId) return;
  userLogoutCutoffSec.set(String(userId), Math.floor(Date.now() / 1000));
};

export const isTokenIssuedBeforeLogout = (userId, iatSec) => {
  if (!userId || !iatSec) return false;
  const cutoff = userLogoutCutoffSec.get(String(userId));
  return Boolean(cutoff && iatSec < cutoff);
};

// Cryptographic HMAC-SHA256 signing & verification for QR pass payloads
const computeQrHmac = ({ vmsBadge, visitor, host, createdAt }) => {
  const canonical = `${vmsBadge || ''}|${visitor || ''}|${host || ''}|${createdAt || ''}`;
  return crypto
    .createHmac('sha256', securityConfig.qrHmacSecret)
    .update(canonical)
    .digest('hex');
};

export const signQrPayload = ({ vmsBadge, visitor, host, createdAt }) => {
  const sig = computeQrHmac({ vmsBadge, visitor, host, createdAt });
  return {
    v: 2,
    vmsBadge,
    visitor,
    host,
    createdAt,
    sig
  };
};

export const verifyQrSignature = (parsed) => {
  if (!parsed || typeof parsed !== 'object' || typeof parsed.sig !== 'string') {
    return false;
  }
  const expected = computeQrHmac(parsed);
  const sigBuf = Buffer.from(parsed.sig, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(sigBuf, expBuf);
};

// Escape SQL LIKE wildcards (%, _)
export const escapeLike = (str) => String(str || '').replace(/[%_\\]/g, '\\$&');

// Mask sensitive phone number for unauthenticated views
export const maskPhone = (phone) => {
  const clean = String(phone || '').trim();
  if (clean.length <= 4) return '****';
  return `${'*'.repeat(Math.max(4, clean.length - 4))}${clean.slice(-4)}`;
};

// Neutralize CSV formula injection (CWE-1236)
export const sanitizeCsvCell = (value) => {
  const str = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
};
