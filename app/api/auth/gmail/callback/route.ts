/**
 * Gmail OAuth Callback Endpoint
 * 
 * GET /api/auth/gmail/callback
 * 
 * Handles OAuth callback from Google
 * Exchanges authorization code for tokens
 * Stores tokens securely
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getUserInfo } from '@/lib/gmail/oauth-client';
import { saveToken } from '@/lib/gmail/token-storage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // Handle user denial
    if (error) {
      console.error('❌ OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/?error=oauth_denied&message=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Check for authorization code
    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=no_code&message=No authorization code received', request.url)
      );
    }

    // Exchange code for tokens
    console.log('🔄 Exchanging authorization code for tokens...');
    const { accessToken, refreshToken, expiresAt } = await exchangeCodeForTokens(code);

    if (!refreshToken) {
      console.warn('⚠️  No refresh token received. User may need to re-authenticate.');
    }

    // Get user info to identify the user
    console.log('📧 Getting user info from Google...');
    let userId: string;
    
    try {
      const userInfo = await getUserInfo(accessToken);
      userId = userInfo.email;
    } catch (userInfoError: any) {
      console.warn('⚠️  Failed to get user info, will need user to provide email:', userInfoError.message);
      // If we can't get user info, we'll need to handle this differently
      // For now, we'll use a placeholder and require user to provide email
      // In a real app, you might want to show a form to enter email
      throw new Error('Failed to get user email. Please ensure userinfo.email scope is granted. Original error: ' + userInfoError.message);
    }

    // Save tokens
    console.log(`💾 Saving tokens for user: ${userId}`);
    await saveToken({
      userId,
      accessToken,
      refreshToken: refreshToken || '', // Store empty string if no refresh token
      expiresAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log('✅ Gmail OAuth completed successfully!');

    // Parse return URL from state (if provided)
    let returnUrl = '/';
    try {
      if (state) {
        const stateData = JSON.parse(state);
        returnUrl = stateData.returnUrl || '/';
      }
    } catch (e) {
      // State parsing failed, use default
    }

    // Redirect to success page or return URL
    return NextResponse.redirect(
      new URL(`${returnUrl}?gmail_connected=true&email=${encodeURIComponent(userId)}`, request.url)
    );
  } catch (error: any) {
    console.error('❌ Gmail OAuth callback error:', error);
    
    return NextResponse.redirect(
      new URL(
        `/?error=oauth_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`,
        request.url
      )
    );
  }
}

