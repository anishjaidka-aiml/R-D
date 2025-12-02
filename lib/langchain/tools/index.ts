/**
 * Tool Registry
 * 
 * Central registry of all available tools for agents
 * 
 * NOTE: This file imports actual tool implementations (including googleapis).
 * For client components, use tool-metadata.ts instead.
 */

import { emailTool } from './email-tool';
import { gmailTool } from './gmail-tool';
import { httpTool } from './http-tool';
import { searchTool } from './search-tool';
import { calculatorTool } from './calculator-tool';
import { DynamicStructuredTool } from '@langchain/core/tools';

// Re-export metadata for convenience (but prefer tool-metadata.ts for client components)
export { TOOL_METADATA, getAllToolNames as getAllToolNamesFromMetadata } from './tool-metadata';

/**
 * All available tools
 */
export const ALL_TOOLS: Record<string, DynamicStructuredTool> = {
  send_email: emailTool, // Resend-based email tool
  send_gmail: gmailTool, // Gmail API-based email tool
  http_request: httpTool,
  search_web: searchTool,
  calculator: calculatorTool,
};

/**
 * Get tools by names
 */
export function getTools(toolNames: string[]): DynamicStructuredTool[] {
  return toolNames
    .filter(name => name in ALL_TOOLS)
    .map(name => ALL_TOOLS[name]);
}

/**
 * Get all tool names (server-side only - imports tool implementations)
 * For client components, use getAllToolNames() from tool-metadata.ts
 */
export function getAllToolNames(): string[] {
  return Object.keys(ALL_TOOLS);
}

/**
 * Get tool by name
 */
export function getTool(toolName: string): DynamicStructuredTool | null {
  return ALL_TOOLS[toolName] || null;
}

/**
 * Tool metadata for UI
 * 
 * NOTE: This is re-exported from tool-metadata.ts for backward compatibility.
 * Client components should import directly from tool-metadata.ts to avoid
 * bundling server-only dependencies like googleapis.
 */

