import { NextResponse } from 'next/server';
import { testAIMLConnection } from '@/lib/langchain/client';

/**
 * API Route to test AI.ML connection
 * 
 * GET /api/test-connection
 * 
 * Tests if LangChain can successfully connect to AI.ML API
 * and get a response from the LLM.
 */
export async function GET() {
  try {
    const result = await testAIMLConnection();
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: `Connection test failed: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

