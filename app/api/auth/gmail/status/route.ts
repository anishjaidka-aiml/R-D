/**
 * Gmail Connection Status Endpoint
 * 
 * GET /api/auth/gmail/status?userId=email@example.com
 * 
 * Check if a user has connected their Gmail account
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken, hasValidToken } from '@/lib/gmail/token-storage';
import { needsReauthentication } from '@/lib/gmail/token-refresh';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    const token = await getToken(userId);
    const isValid = token ? await hasValidToken(userId) : false;
    const needsReauth = token ? await needsReauthentication(userId) : true;

    return NextResponse.json({
      connected: !!token,
      valid: isValid,
      needsReauthentication: needsReauth,
      email: userId,
      expiresAt: token?.expiresAt || null,
    });
  } catch (error: any) {
    console.error('❌ Gmail status check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check Gmail status',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

