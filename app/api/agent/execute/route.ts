import { NextRequest, NextResponse } from 'next/server';
import { executeAgent } from '@/lib/langchain/agent-executor';
import { AgentConfig } from '@/types/agent';

/**
 * API Route to execute an agent
 * 
 * POST /api/agent/execute
 * 
 * Body:
 * {
 *   prompt: string;
 *   config?: Partial<AgentConfig>;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, config } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log("📥 Received agent execution request");
    console.log(`  Prompt: ${prompt.substring(0, 100)}...`);

    const result = await executeAgent(prompt, config);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Agent execution API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute agent',
        output: '',
        executionTime: 0,
      },
      { status: 500 }
    );
  }
}

