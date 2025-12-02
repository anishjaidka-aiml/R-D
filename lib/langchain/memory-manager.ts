/**
 * Memory Manager for LangChain Agents
 * 
 * This module provides different types of memory for conversational agents:
 * - BufferMemory: Stores entire conversation
 * - BufferWindowMemory: Keeps last N messages
 * - SummaryMemory: Summarizes old messages (TODO)
 * 
 * Memory allows agents to:
 * - Remember previous messages
 * - Maintain context across turns
 * - Reference past interactions
 */

import { BufferMemory } from "langchain/memory";
import { BufferWindowMemory } from "langchain/memory";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

/**
 * Memory Types
 */
export type MemoryType = "buffer" | "buffer_window" | "summary";

/**
 * Memory Configuration
 */
export interface MemoryConfig {
  type: MemoryType;
  /** For buffer_window: number of messages to keep */
  windowSize?: number;
  /** Memory key for storing chat history */
  memoryKey?: string;
  /** Input key for new messages */
  inputKey?: string;
  /** Output key for responses */
  outputKey?: string;
  /** Return messages as string or objects */
  returnMessages?: boolean;
}

/**
 * Conversation Session
 * Each conversation has a unique ID and its own memory
 */
export interface ConversationSession {
  id: string;
  memory: BufferMemory | BufferWindowMemory;
  createdAt: Date;
  lastAccessedAt: Date;
  messageCount: number;
}

/**
 * In-memory storage for conversation sessions
 * In production, you'd use Redis, Database, etc.
 */
class MemoryStore {
  private sessions: Map<string, ConversationSession> = new Map();
  private readonly MAX_SESSIONS = 100;
  private readonly SESSION_TIMEOUT_MS = 3600000; // 1 hour

  /**
   * Get or create a conversation session
   */
  getSession(conversationId: string, config: MemoryConfig): ConversationSession {
    // Clean up old sessions
    this.cleanupOldSessions();

    let session = this.sessions.get(conversationId);

    if (!session) {
      // Create new session
      const memory = this.createMemory(config);
      session = {
        id: conversationId,
        memory,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        messageCount: 0,
      };
      this.sessions.set(conversationId, session);
      console.log(`💾 Created new session: ${conversationId}`);
    } else {
      // Update last accessed time
      session.lastAccessedAt = new Date();
    }

    return session;
  }

  /**
   * Create memory based on configuration
   */
  private createMemory(config: MemoryConfig): BufferMemory | BufferWindowMemory {
    const memoryKey = config.memoryKey || "chat_history";
    const inputKey = config.inputKey || "input";
    const outputKey = config.outputKey || "output";
    const returnMessages = config.returnMessages ?? true;

    switch (config.type) {
      case "buffer":
        return new BufferMemory({
          memoryKey,
          inputKey,
          outputKey,
          returnMessages,
        });

      case "buffer_window":
        return new BufferWindowMemory({
          k: config.windowSize || 10, // Keep last 10 messages by default
          memoryKey,
          inputKey,
          outputKey,
          returnMessages,
        });

      default:
        return new BufferMemory({
          memoryKey,
          inputKey,
          outputKey,
          returnMessages,
        });
    }
  }

  /**
   * Delete a session
   */
  deleteSession(conversationId: string): boolean {
    const deleted = this.sessions.delete(conversationId);
    if (deleted) {
      console.log(`🗑️ Deleted session: ${conversationId}`);
    }
    return deleted;
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): ConversationSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clean up old sessions
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    const sessionsToDelete: string[] = [];

    // Find sessions to delete
    this.sessions.forEach((session, id) => {
      const age = now - session.lastAccessedAt.getTime();
      if (age > this.SESSION_TIMEOUT_MS) {
        sessionsToDelete.push(id);
      }
    });

    // Delete old sessions
    sessionsToDelete.forEach(id => this.deleteSession(id));

    // If still too many sessions, delete oldest
    if (this.sessions.size > this.MAX_SESSIONS) {
      const sorted = Array.from(this.sessions.entries())
        .sort((a, b) => a[1].lastAccessedAt.getTime() - b[1].lastAccessedAt.getTime());
      
      const toDelete = sorted.slice(0, this.sessions.size - this.MAX_SESSIONS);
      toDelete.forEach(([id]) => this.deleteSession(id));
    }
  }

  /**
   * Get session statistics
   */
  getStats() {
    return {
      totalSessions: this.sessions.size,
      sessions: this.getAllSessions().map(s => ({
        id: s.id,
        messageCount: s.messageCount,
        age: Date.now() - s.createdAt.getTime(),
        lastAccessed: Date.now() - s.lastAccessedAt.getTime(),
      })),
    };
  }
}

// Singleton instance
const memoryStore = new MemoryStore();

/**
 * Get memory for a conversation
 */
export function getConversationMemory(
  conversationId: string,
  config: MemoryConfig = { type: "buffer" }
): BufferMemory | BufferWindowMemory {
  const session = memoryStore.getSession(conversationId, config);
  return session.memory;
}

/**
 * Add a message pair to memory
 */
export async function addToMemory(
  conversationId: string,
  input: string,
  output: string,
  config: MemoryConfig = { type: "buffer" }
): Promise<void> {
  const session = memoryStore.getSession(conversationId, config);
  await session.memory.saveContext({ input }, { output });
  session.messageCount += 2; // Input + output
  console.log(`💬 Added to memory [${conversationId}]: "${input.substring(0, 50)}..."`);
}

/**
 * Load memory variables (get chat history)
 */
export async function loadMemory(
  conversationId: string,
  config: MemoryConfig = { type: "buffer" }
): Promise<any> {
  const session = memoryStore.getSession(conversationId, config);
  return await session.memory.loadMemoryVariables({});
}

/**
 * Clear memory for a conversation
 */
export async function clearMemory(conversationId: string): Promise<void> {
  const session = memoryStore.getSession(conversationId, { type: "buffer" });
  await session.memory.clear();
  session.messageCount = 0;
  console.log(`🧹 Cleared memory: ${conversationId}`);
}

/**
 * Delete a conversation session
 */
export function deleteConversation(conversationId: string): boolean {
  return memoryStore.deleteSession(conversationId);
}

/**
 * Get all conversations
 */
export function getAllConversations(): ConversationSession[] {
  return memoryStore.getAllSessions();
}

/**
 * Get memory statistics
 */
export function getMemoryStats() {
  return memoryStore.getStats();
}

/**
 * Format chat history for display
 */
export function formatChatHistory(messages: BaseMessage[]): string {
  return messages
    .map(msg => {
      const role = msg._getType();
      const content = msg.content;
      return `${role.toUpperCase()}: ${content}`;
    })
    .join("\n");
}

/**
 * Generate unique conversation ID
 */
export function generateConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

export default {
  getConversationMemory,
  addToMemory,
  loadMemory,
  clearMemory,
  deleteConversation,
  getAllConversations,
  getMemoryStats,
  formatChatHistory,
  generateConversationId,
};

