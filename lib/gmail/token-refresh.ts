/**
 * Gmail Token Refresh Utility
 * 
 * Handles automatic token refresh for Gmail OAuth tokens
 */

import { getToken, saveToken, isTokenExpired } from './token-storage';
import { refreshAccessToken } from './oauth-client';
import type { GmailTokenData } from './token-storage';

/**
 * Get a valid access token for a user
 * Automatically refreshes if expired
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  try {
    // Get stored token
    const token = await getToken(userId);
    
    if (!token) {
      console.log(`⚠️  No token found for user: ${userId}`);
      return null;
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      console.log(`🔄 Token expired for user: ${userId}, refreshing...`);
      
      // Check if we have a refresh token
      if (!token.refreshToken || token.refreshToken.trim() === '') {
        console.error(`❌ No refresh token available for user: ${userId}. User needs to re-authenticate.`);
        return null;
      }

      try {
        // Refresh the token
        const { accessToken, expiresAt } = await refreshAccessToken(token.refreshToken);
        
        // Update stored token
        await saveToken({
          userId: token.userId,
          accessToken,
          refreshToken: token.refreshToken, // Keep existing refresh token
          expiresAt,
          createdAt: token.createdAt,
          updatedAt: Date.now(),
        });

        console.log(`✅ Token refreshed successfully for user: ${userId}`);
        return accessToken;
      } catch (refreshError: any) {
        console.error(`❌ Failed to refresh token for user ${userId}:`, refreshError);
        return null;
      }
    }

    // Token is still valid
    return token.accessToken;
  } catch (error: any) {
    console.error(`❌ Error getting valid access token for user ${userId}:`, error);
    return null;
  }
}

/**
 * Check if user needs to re-authenticate
 */
export async function needsReauthentication(userId: string): Promise<boolean> {
  const token = await getToken(userId);
  
  if (!token) {
    return true; // No token, needs authentication
  }

  // If expired and no refresh token, needs re-authentication
  if (isTokenExpired(token) && (!token.refreshToken || token.refreshToken.trim() === '')) {
    return true;
  }

  return false;
}

