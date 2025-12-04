/**
 * Multi-Agent System - Agent Types
 * 
 * Defines agent types, definitions, and message structures
 */

/**
 * Agent specialization types
 */
export enum AgentType {
  GENERALIST = 'generalist',
  RESEARCH = 'research',
  WRITING = 'writing',
  CODE = 'code',
  ANALYSIS = 'analysis',
  CREATIVE = 'creative',
  SUPERVISOR = 'supervisor',
}

/**
 * Agent definition - describes an agent's capabilities
 */
export interface AgentDefinition {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
  temperature?: number;
  model?: string;
  maxTokens?: number;
}

/**
 * Message passed between agents
 */
export interface AgentMessage {
  from: string; // Agent ID
  to: string; // Agent ID or 'broadcast' for all
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Agent execution context
 */
export interface AgentContext {
  agentId: string;
  task: string;
  input?: any;
  sharedContext?: Record<string, any>;
  messages?: AgentMessage[];
  previousResults?: Record<string, any>;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  agentId: string;
  agentName: string;
  success: boolean;
  output: string;
  reasoning?: string[];
  toolCalls?: Array<{
    tool: string;
    input: any;
    output: any;
  }>;
  executionTime: number;
  error?: string;
}

/**
 * Multi-agent execution result
 */
export interface MultiAgentExecutionResult {
  executionId: string;
  mode: 'supervised' | 'parallel' | 'sequential';
  success: boolean;
  results: Record<string, AgentExecutionResult>;
  aggregatedOutput: string;
  supervisorDecision?: {
    selectedAgents: string[];
    reasoning: string;
    executionMode: 'parallel' | 'sequential';
  };
  executionTime: number;
  error?: string;
}

/**
 * Supervisor routing decision
 */
export interface SupervisorDecision {
  selectedAgents: string[];
  reasoning: string;
  executionMode: 'parallel' | 'sequential';
  taskBreakdown?: Array<{
    agent: string;
    subtask: string;
  }>;
}

