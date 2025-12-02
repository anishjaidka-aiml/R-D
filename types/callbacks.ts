/**
 * Callback Types
 * 
 * Type definitions for agent execution callbacks
 */

/**
 * Callback event types
 */
export type CallbackEventType = 
  | 'agent_start'
  | 'agent_end'
  | 'llm_start'
  | 'llm_end'
  | 'tool_start'
  | 'tool_end'
  | 'iteration_start'
  | 'iteration_end'
  | 'error'
  | 'complete';

/**
 * Base callback event
 */
export interface CallbackEvent {
  type: CallbackEventType;
  timestamp: number;
  executionId?: string;
}

/**
 * Agent start callback
 */
export interface AgentStartCallback extends CallbackEvent {
  type: 'agent_start';
  prompt: string;
  tools?: string[];
  config?: {
    temperature?: number;
    model?: string;
    maxTokens?: number;
  };
}

/**
 * Agent end callback
 */
export interface AgentEndCallback extends CallbackEvent {
  type: 'agent_end';
  success: boolean;
  output?: string;
  executionTime: number;
  toolCalls?: number;
}

/**
 * LLM start callback
 */
export interface LLMStartCallback extends CallbackEvent {
  type: 'llm_start';
  messages: number;
  iteration?: number;
}

/**
 * LLM end callback
 */
export interface LLMEndCallback extends CallbackEvent {
  type: 'llm_end';
  response: string;
  tokens?: number;
  duration: number;
}

/**
 * Tool start callback
 */
export interface ToolStartCallback extends CallbackEvent {
  type: 'tool_start';
  toolName: string;
  parameters: Record<string, any>;
  iteration?: number;
}

/**
 * Tool end callback
 */
export interface ToolEndCallback extends CallbackEvent {
  type: 'tool_end';
  toolName: string;
  result: any;
  duration: number;
  success: boolean;
}

/**
 * Iteration start callback
 */
export interface IterationStartCallback extends CallbackEvent {
  type: 'iteration_start';
  iteration: number;
  maxIterations: number;
}

/**
 * Iteration end callback
 */
export interface IterationEndCallback extends CallbackEvent {
  type: 'iteration_end';
  iteration: number;
  action: 'tool_call' | 'final_answer' | 'continue';
}

/**
 * Error callback
 */
export interface ErrorCallback extends CallbackEvent {
  type: 'error';
  error: string;
  errorType: 'tool_error' | 'llm_error' | 'execution_error';
  context?: Record<string, any>;
}

/**
 * Complete callback
 */
export interface CompleteCallback extends CallbackEvent {
  type: 'complete';
  success: boolean;
  output: string;
  totalExecutionTime: number;
  totalIterations: number;
  totalToolCalls: number;
}

/**
 * Union type for all callbacks
 */
export type CallbackEventData =
  | AgentStartCallback
  | AgentEndCallback
  | LLMStartCallback
  | LLMEndCallback
  | ToolStartCallback
  | ToolEndCallback
  | IterationStartCallback
  | IterationEndCallback
  | ErrorCallback
  | CompleteCallback;

/**
 * Callback function type
 */
export type CallbackFunction = (event: CallbackEventData) => void | Promise<void>;

/**
 * Callback handler interface
 */
export interface CallbackHandler {
  onAgentStart?: CallbackFunction;
  onAgentEnd?: CallbackFunction;
  onLLMStart?: CallbackFunction;
  onLLMEnd?: CallbackFunction;
  onToolStart?: CallbackFunction;
  onToolEnd?: CallbackFunction;
  onIterationStart?: CallbackFunction;
  onIterationEnd?: CallbackFunction;
  onError?: CallbackFunction;
  onComplete?: CallbackFunction;
  
  // Generic handler for all events
  handle?: CallbackFunction;
}

/**
 * Callback manager
 */
export interface CallbackManager {
  handlers: CallbackHandler[];
  addHandler(handler: CallbackHandler): void;
  removeHandler(handler: CallbackHandler): void;
  emit(event: CallbackEventData): Promise<void>;
}

