/**
 * Gmail OAuth Token Storage (UCS-backed)
 *
 * Instead of JSON file storage, this version stores
 * and reads tokens from the UCS tables:
 *   - external_accounts
 *   - provider_tokens
 */

import { query } from "@/lib/db";
import {
  getCredential,
  upsertCredential,
  deleteCredential,
} from "@/lib/ucs/credentials";

export interface GmailTokenData {
  userId: string;        // app user id
  accessToken: string;
  refreshToken: string;
  expiresAt: number;     // Unix ms timestamp
  createdAt: number;     // Unix ms timestamp
  updatedAt: number;     // Unix ms timestamp
}

/**
 * Save or update Gmail token for a user in UCS.
 * Used after initial OAuth or after refresh.
 */
export async function saveToken(tokenData: GmailTokenData): Promise<void> {
  // Try to reuse existing external account info (email, provider_user_id, scopes)
  const existing = await getCredential(tokenData.userId, "gmail");

  const providerUserId =
    existing?.providerUserId ?? tokenData.userId; // fallback if we don't have it
  const username = existing?.username ?? null;
  const email = existing?.email ?? null;
  const scopes = existing?.scopes ?? null;

  await upsertCredential({
    userId: tokenData.userId,
    provider: "gmail",
    providerUserId,
    username,
    email,
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
    expiresAt: new Date(tokenData.expiresAt),
    scopes,
  });
}

/**
 * Get Gmail token for a user from UCS.
 * Flows should use this to configure the Gmail client.
 */
export async function getToken(
  userId: string
): Promise<GmailTokenData | null> {
  const cred = await getCredential(userId, "gmail");
  if (!cred || !cred.accessToken) return null;

  const now = Date.now();
  const expiresAt = cred.expiresAt
    ? new Date(cred.expiresAt).getTime()
    : now + 30 * 60 * 1000; // default: 30min ahead if missing

  return {
    userId,
    accessToken: cred.accessToken,
    refreshToken: cred.refreshToken ?? "",
    expiresAt,
    createdAt: now, // not tracked in UCS; fine for flows
    updatedAt: now,
  };
}

/**
 * Delete Gmail token + external account for a user from UCS.
 */
export async function deleteToken(userId: string): Promise<void> {
  await deleteCredential(userId, "gmail");
}

/**
 * Check if token exists and is valid (not expired with 5m buffer)
 */
export async function hasValidToken(userId: string): Promise<boolean> {
  const token = await getToken(userId);
  if (!token) return false;

  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 minutes
  return token.expiresAt > now + buffer;
}

/**
 * Get all app user IDs that have a Gmail credential stored in UCS.
 */
export async function getAllUserIds(): Promise<string[]> {
  const res = await query<{ user_id: string }>(
    `
    SELECT DISTINCT user_id
    FROM external_accounts
    WHERE provider = 'gmail';
    `
  );
  return res.rows.map((r) => r.user_id);
}

/**
 * Check if token is expired (with 5 minute buffer)
 */
export function isTokenExpired(token: GmailTokenData): boolean {
  const now = Date.now();
  const buffer = 5 * 60 * 1000;
  return token.expiresAt <= now + buffer;
}
