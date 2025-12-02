/**
 * Gmail OAuth Client
 * 
 * Handles OAuth 2.0 flow for Gmail API
 */

import { google } from 'googleapis';

/**
 * Get OAuth2 client configuration
 */
export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Gmail OAuth credentials not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in environment variables.');
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthUrl(state?: string): string {
  const oauth2Client = getOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email', // Required to get user email
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required to get refresh token
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
    state: state || 'default', // CSRF protection
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}> {
  const oauth2Client = getOAuth2Client();
  
  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.access_token) {
    throw new Error('Failed to get access token from Google');
  }

  // Calculate expiration time
  // Google tokens typically expire in 1 hour (3600 seconds)
  const expiresIn = tokens.expiry_date 
    ? tokens.expiry_date * 1000 // Convert to milliseconds
    : Date.now() + (3600 * 1000); // Default to 1 hour if not provided

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    expiresAt: expiresIn,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: number;
}> {
  const oauth2Client = getOAuth2Client();
  
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  
  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token');
  }

  const expiresAt = credentials.expiry_date
    ? credentials.expiry_date * 1000
    : Date.now() + (3600 * 1000);

  return {
    accessToken: credentials.access_token,
    expiresAt,
  };
}

/**
 * Decode JWT token to extract email (fallback method)
 */
function decodeTokenEmail(accessToken: string): string | null {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      return null; // Not a JWT token
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed (base64url encoding)
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = Buffer.from(paddedPayload, 'base64').toString('utf-8');
    const tokenData = JSON.parse(decoded);

    // Try to get email from token claims
    return tokenData.email || tokenData.sub || null;
  } catch (error) {
    console.warn('Could not decode token email:', error);
    return null;
  }
}

/**
 * Get user info from access token
 */
export async function getUserInfo(accessToken: string): Promise<{
  email: string;
  name?: string;
}> {
  const oauth2Client = getOAuth2Client();
  
  // Set credentials with the access token
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  // Try to get user info from OAuth2 API
  try {
    const oauth2 = google.oauth2({
      version: 'v2',
      auth: oauth2Client,
    });

    const { data } = await oauth2.userinfo.get();

    if (data.email) {
      return {
        email: data.email,
        name: data.name || undefined,
      };
    }
  } catch (apiError: any) {
    console.warn('⚠️  OAuth2 API call failed, trying token decode:', apiError.message);
    
    // Fallback: Try to decode email from token
    const emailFromToken = decodeTokenEmail(accessToken);
    if (emailFromToken) {
      console.log('✅ Extracted email from token');
      return {
        email: emailFromToken,
      };
    }

    // If both methods fail, throw error
    throw new Error(`Failed to get user email. OAuth2 API error: ${apiError.message}. Please ensure userinfo.email scope is granted in Google Cloud Console.`);
  }

  throw new Error('Failed to get user email from Google');
}

