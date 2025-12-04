/**
 * Tool Metadata (Client-Safe)
 * 
 * This file contains only tool metadata and names that can be safely
 * imported in client components without importing the actual tool implementations.
 * This prevents Next.js from trying to bundle server-only dependencies like googleapis.
 */

/**
 * All available tool names
 * Keep this in sync with ALL_TOOLS in index.ts
 */
export const ALL_TOOL_NAMES = [
  'send_email',    // Resend-based email tool
  'send_gmail',    // Gmail API-based email tool
  'http_request',
  'search_web',
  'calculator',
  'query_documents', // RAG tool for document querying
] as const;

/**
 * Tool metadata for UI
 */
export const TOOL_METADATA = {
  send_email: {
    name: 'Send Email (Resend)',
    icon: '📧',
    description: 'Send emails via Resend API',
    category: 'Communication',
  },
  send_gmail: {
    name: 'Send Gmail',
    icon: '📬',
    description: 'Send emails via Gmail (requires Gmail connection)',
    category: 'Communication',
  },
  http_request: {
    name: 'HTTP Request',
    icon: '🌐',
    description: 'Make HTTP API requests',
    category: 'Integration',
  },
  search_web: {
    name: 'Web Search',
    icon: '🔍',
    description: 'Search the web for information',
    category: 'Information',
  },
  calculator: {
    name: 'Calculator',
    icon: '🔢',
    description: 'Perform mathematical calculations',
    category: 'Utility',
  },
  query_documents: {
    name: 'Query Documents (RAG)',
    icon: '📚',
    description: 'Search and query uploaded documents using RAG',
    category: 'Information',
  },
} as const;

/**
 * Get all tool names (client-safe)
 */
export function getAllToolNames(): string[] {
  return [...ALL_TOOL_NAMES];
}

/**
 * Get tool metadata by name
 */
export function getToolMetadata(toolName: string) {
  return TOOL_METADATA[toolName as keyof typeof TOOL_METADATA] || null;
}

