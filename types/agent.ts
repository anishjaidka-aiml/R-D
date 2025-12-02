/**
 * Agent Types
 * 
 * Type definitions for AI agents, tools, and memory
 */

import { z } from 'zod';

/**
 * Tool parameter schema (Zod schema for validation)
 */
export type ToolParameterSchema = z.ZodObject<any>;

/**
 * Tool definition
 */
export interface ToolDefinition {
  name: string;
  description: string;
  schema: ToolParameterSchema;
  execute: (params: any) => Promise<any>;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  name: string;
  description?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools: string[]; // Tool names to make available
  memory?: MemoryConfig;
}

/**
 * Memory configuration
 */
export interface MemoryConfig {
  enabled: boolean;
  type: 'buffer' | 'summary' | 'entity';
  maxMessages?: number;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  success: boolean;
  output: string;
  reasoning?: string[];
  toolCalls?: ToolCall[];
  error?: string;
  executionTime: number;
  conversationId?: string; // For conversational agents
}

/**
 * Tool call record
 */
export interface ToolCall {
  toolName: string;
  parameters: Record<string, any>;
  result: any;
  timestamp: string;
}

/**
 * Message in conversation
 */
export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp?: string;
  toolCallId?: string;
}

/**
 * Agent state
 */
export interface AgentState {
  agentId: string;
  messages: Message[];
  toolCalls: ToolCall[];
  createdAt: string;
  updatedAt: string;
}

