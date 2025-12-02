/**
 * Gmail OAuth Token Storage
 * 
 * Secure storage for Gmail OAuth tokens with encryption
 * Uses JSON file storage (similar to workflows)
 */

import fs from 'fs/promises';
import path from 'path';
import CryptoJS from 'crypto-js';

const DATA_DIR = path.join(process.cwd(), 'data');
const TOKENS_FILE = path.join(DATA_DIR, 'gmail-tokens.json');

/**
 * Token data structure
 */
export interface GmailTokenData {
  userId: string; // Email address or user identifier
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  expiresAt: number; // Unix timestamp
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

/**
 * Stored token structure (with encrypted tokens)
 */
interface StoredTokenData {
  userId: string;
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): string {
  const key = process.env.OAUTH_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('OAUTH_ENCRYPTION_KEY is not set in environment variables');
  }
  return key;
}

/**
 * Encrypt a string
 */
function encrypt(text: string): string {
  const key = getEncryptionKey();
  return CryptoJS.AES.encrypt(text, key).toString();
}

/**
 * Decrypt a string
 */
function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const bytes = CryptoJS.AES.decrypt(encryptedText, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Ensure data directory exists
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

/**
 * Read all tokens from storage
 */
async function readTokens(): Promise<StoredTokenData[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(TOKENS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid
    return [];
  }
}

/**
 * Write tokens to storage
 */
async function writeTokens(tokens: StoredTokenData[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

/**
 * Save or update a token
 */
export async function saveToken(tokenData: GmailTokenData): Promise<void> {
  const tokens = await readTokens();
  
  // Encrypt tokens before storing
  const storedToken: StoredTokenData = {
    userId: tokenData.userId,
    encryptedAccessToken: encrypt(tokenData.accessToken),
    encryptedRefreshToken: encrypt(tokenData.refreshToken),
    expiresAt: tokenData.expiresAt,
    createdAt: tokenData.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  // Check if token already exists for this user
  const existingIndex = tokens.findIndex(t => t.userId === tokenData.userId);
  
  if (existingIndex >= 0) {
    // Update existing token
    tokens[existingIndex] = storedToken;
  } else {
    // Add new token
    tokens.push(storedToken);
  }

  await writeTokens(tokens);
}

/**
 * Get token for a user
 */
export async function getToken(userId: string): Promise<GmailTokenData | null> {
  const tokens = await readTokens();
  const storedToken = tokens.find(t => t.userId === userId);
  
  if (!storedToken) {
    return null;
  }

  try {
    // Decrypt tokens
    return {
      userId: storedToken.userId,
      accessToken: decrypt(storedToken.encryptedAccessToken),
      refreshToken: decrypt(storedToken.encryptedRefreshToken),
      expiresAt: storedToken.expiresAt,
      createdAt: storedToken.createdAt,
      updatedAt: storedToken.updatedAt,
    };
  } catch (error) {
    console.error('Failed to decrypt token:', error);
    return null;
  }
}

/**
 * Delete token for a user
 */
export async function deleteToken(userId: string): Promise<void> {
  const tokens = await readTokens();
  const filteredTokens = tokens.filter(t => t.userId !== userId);
  await writeTokens(filteredTokens);
}

/**
 * Check if token exists and is valid (not expired)
 */
export async function hasValidToken(userId: string): Promise<boolean> {
  const token = await getToken(userId);
  if (!token) {
    return false;
  }
  
  // Check if token is expired (with 5 minute buffer)
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 minutes
  return token.expiresAt > (now + buffer);
}

/**
 * Get all user IDs with stored tokens
 */
export async function getAllUserIds(): Promise<string[]> {
  const tokens = await readTokens();
  return tokens.map(t => t.userId);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: GmailTokenData): boolean {
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 minutes buffer
  return token.expiresAt <= (now + buffer);
}

