/**
 * Gmail OAuth Initiation Endpoint
 * 
 * GET /api/auth/gmail
 * 
 * Initiates OAuth flow by redirecting user to Google consent screen
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/gmail/oauth-client';

export async function GET(request: NextRequest) {
  try {
    // Optional: Get state parameter for CSRF protection
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state') || undefined;
    const returnUrl = searchParams.get('returnUrl') || '/';

    // Store return URL in state (or use a session/cookie)
    const stateWithReturn = JSON.stringify({ 
      state: state || 'default',
      returnUrl 
    });

    // Generate OAuth URL
    const authUrl = getAuthUrl(stateWithReturn);

    // Redirect to Google consent screen
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('❌ Gmail OAuth initiation error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to initiate Gmail OAuth',
        message: error.message || 'Unknown error',
        details: 'Please ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI are set in environment variables.',
      },
      { status: 500 }
    );
  }
}

