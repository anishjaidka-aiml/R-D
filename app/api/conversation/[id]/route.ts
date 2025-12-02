/**
 * Individual Conversation API
 * 
 * GET /api/conversation/[id] - Get conversation history
 * DELETE /api/conversation/[id] - Clear conversation memory
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  loadMemory, 
  clearMemory,
  deleteConversation,
  formatChatHistory 
} from "@/lib/langchain/memory-manager";
import { BaseMessage } from "@langchain/core/messages";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET - Get conversation history
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const conversationId = params.id;

    console.log(`\n📖 Get conversation history: ${conversationId}`);

    // Load memory
    const memoryData = await loadMemory(conversationId);
    const chatHistory: BaseMessage[] = memoryData.chat_history || [];

    // Format messages for response
    const messages = chatHistory.map((msg: BaseMessage) => ({
      role: msg._getType(),
      content: msg.content,
    }));

    // Format as readable text
    const formattedHistory = formatChatHistory(chatHistory);

    return NextResponse.json({
      conversationId,
      messageCount: messages.length,
      messages,
      formattedHistory,
    });

  } catch (error: any) {
    console.error('❌ Get conversation history error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversation history',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear conversation memory
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const conversationId = params.id;
    const url = new URL(request.url);
    const action = url.searchParams.get('action'); // 'clear' or 'delete'

    console.log(`\n🗑️ Delete conversation: ${conversationId} (${action})`);

    if (action === 'delete') {
      // Completely remove session
      const deleted = deleteConversation(conversationId);
      
      if (!deleted) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Conversation deleted',
        conversationId,
      });
    } else {
      // Just clear memory (keep session)
      await clearMemory(conversationId);

      return NextResponse.json({
        success: true,
        message: 'Conversation memory cleared',
        conversationId,
      });
    }

  } catch (error: any) {
    console.error('❌ Delete conversation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete conversation',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

