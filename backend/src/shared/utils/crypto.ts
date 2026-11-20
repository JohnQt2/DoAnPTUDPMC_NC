import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  sessionId?: number;
  familyId?: string;
}

export function generateOtp(): string {
  // Cryptographically secure 6-digit OTP
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashString(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function parseDurationToSeconds(spec: string, fallbackSeconds: number): number {
  const trimmed = spec.trim();
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  const match = trimmed.match(/^(\d+)\s*(s|m|h|d|w)$/i);
  if (!match) return fallbackSeconds;
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };
  return amount * (multipliers[unit] || 1);
}

export function getAccessTokenTtlSeconds(): number {
  return parseDurationToSeconds(env.JWT_ACCESS_EXPIRES_IN, 3600);
}

export function getRefreshTokenTtlSeconds(): number {
  return parseDurationToSeconds(env.JWT_REFRESH_EXPIRES_IN, 30 * 24 * 3600);
}

export function getRefreshTokenTtlMs(): number {
  return getRefreshTokenTtlSeconds() * 1000;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
