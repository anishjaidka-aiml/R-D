/**
 * Gmail Disconnect Endpoint
 * 
 * DELETE /api/auth/gmail/disconnect?userId=email@example.com
 * 
 * Removes Gmail connection for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteToken } from '@/lib/gmail/token-storage';

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    await deleteToken(userId);

    return NextResponse.json({
      success: true,
      message: `Gmail connection removed for ${userId}`,
    });
  } catch (error: any) {
    console.error('❌ Gmail disconnect error:', error);
    return NextResponse.json(
      {
        error: 'Failed to disconnect Gmail',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

