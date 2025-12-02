/**
 * Conversation API
 * 
 * Handles conversational agent requests with memory
 * 
 * POST /api/conversation - Send message in conversation
 * GET /api/conversations - List all conversations
 */

import { NextRequest, NextResponse } from "next/server";
import { executeConversationalAgent } from "@/lib/langchain/agent-manual";
import { 
  generateConversationId, 
  getAllConversations,
  getMemoryStats 
} from "@/lib/langchain/memory-manager";

/**
 * POST - Send message in a conversation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message, 
      conversationId, 
      tools = [],
      temperature = 0.1,
      model,
      systemPrompt 
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Generate conversation ID if not provided
    const convId = conversationId || generateConversationId();

    console.log(`\n🗨️ Conversation API - POST`);
    console.log(`   Conversation ID: ${convId}`);
    console.log(`   Message: ${message.substring(0, 100)}...`);
    console.log(`   Tools: ${tools.join(', ') || 'none'}`);

    // Execute conversational agent
    const result = await executeConversationalAgent(
      message,
      convId,
      {
        tools,
        temperature,
        model,
        systemPrompt,
      }
    );

    return NextResponse.json({
      ...result,
      conversationId: convId,
    });

  } catch (error: any) {
    console.error('❌ Conversation API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process conversation',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET - List all conversations
 */
export async function GET(request: NextRequest) {
  try {
    const conversations = getAllConversations();
    const stats = getMemoryStats();

    return NextResponse.json({
      conversations: conversations.map(conv => ({
        id: conv.id,
        messageCount: conv.messageCount,
        createdAt: conv.createdAt,
        lastAccessedAt: conv.lastAccessedAt,
      })),
      stats,
    });

  } catch (error: any) {
    console.error('❌ Get conversations error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversations',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

