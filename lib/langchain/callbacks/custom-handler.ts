/**
 * Custom Callback Handler
 * 
 * Implements callback system for monitoring agent execution
 */

import {
  CallbackHandler,
  CallbackManager,
  CallbackEventData,
  CallbackFunction,
} from '@/types/callbacks';

/**
 * Custom callback handler implementation
 */
export class CustomCallbackHandler implements CallbackHandler {
  private handlers: CallbackFunction[] = [];
  private executionId: string;

  constructor(executionId?: string) {
    this.executionId = executionId || `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a callback function
   */
  addCallback(callback: CallbackFunction): void {
    this.handlers.push(callback);
  }

  /**
   * Remove a callback function
   */
  removeCallback(callback: CallbackFunction): void {
    this.handlers = this.handlers.filter(h => h !== callback);
  }

  /**
   * Emit an event to all registered callbacks
   */
  async emit(event: CallbackEventData): Promise<void> {
    // Add execution ID and timestamp if not present
    const eventWithId = {
      ...event,
      executionId: event.executionId || this.executionId,
      timestamp: event.timestamp || Date.now(),
    };

    // Call all registered handlers
    for (const handler of this.handlers) {
      try {
        await handler(eventWithId);
      } catch (error) {
        console.error('Callback handler error:', error);
      }
    }

    // Also call specific handlers if they exist
    if (this.handle) {
      try {
        await this.handle(eventWithId);
      } catch (error) {
        console.error('Generic callback handler error:', error);
      }
    }

    // Call type-specific handlers
    switch (event.type) {
      case 'agent_start':
        if (this.onAgentStart) {
          try {
            await this.onAgentStart(eventWithId);
          } catch (error) {
            console.error('onAgentStart error:', error);
          }
        }
        break;
      case 'agent_end':
        if (this.onAgentEnd) {
          try {
            await this.onAgentEnd(eventWithId);
          } catch (error) {
            console.error('onAgentEnd error:', error);
          }
        }
        break;
      case 'llm_start':
        if (this.onLLMStart) {
          try {
            await this.onLLMStart(eventWithId);
          } catch (error) {
            console.error('onLLMStart error:', error);
          }
        }
        break;
      case 'llm_end':
        if (this.onLLMEnd) {
          try {
            await this.onLLMEnd(eventWithId);
          } catch (error) {
            console.error('onLLMEnd error:', error);
          }
        }
        break;
      case 'tool_start':
        if (this.onToolStart) {
          try {
            await this.onToolStart(eventWithId);
          } catch (error) {
            console.error('onToolStart error:', error);
          }
        }
        break;
      case 'tool_end':
        if (this.onToolEnd) {
          try {
            await this.onToolEnd(eventWithId);
          } catch (error) {
            console.error('onToolEnd error:', error);
          }
        }
        break;
      case 'iteration_start':
        if (this.onIterationStart) {
          try {
            await this.onIterationStart(eventWithId);
          } catch (error) {
            console.error('onIterationStart error:', error);
          }
        }
        break;
      case 'iteration_end':
        if (this.onIterationEnd) {
          try {
            await this.onIterationEnd(eventWithId);
          } catch (error) {
            console.error('onIterationEnd error:', error);
          }
        }
        break;
      case 'error':
        if (this.onError) {
          try {
            await this.onError(eventWithId);
          } catch (error) {
            console.error('onError error:', error);
          }
        }
        break;
      case 'complete':
        if (this.onComplete) {
          try {
            await this.onComplete(eventWithId);
          } catch (error) {
            console.error('onComplete error:', error);
          }
        }
        break;
    }
  }

  // Handler properties
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
  handle?: CallbackFunction;

  /**
   * Get execution ID
   */
  getExecutionId(): string {
    return this.executionId;
  }
}

/**
 * Callback manager implementation
 */
export class CallbackManagerImpl implements CallbackManager {
  handlers: CallbackHandler[] = [];

  /**
   * Add a callback handler
   */
  addHandler(handler: CallbackHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Remove a callback handler
   */
  removeHandler(handler: CallbackHandler): void {
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  /**
   * Emit an event to all handlers
   */
  async emit(event: CallbackEventData): Promise<void> {
    for (const handler of this.handlers) {
      if (handler.handle) {
        try {
          await handler.handle(event);
        } catch (error) {
          console.error('Callback manager handler error:', error);
        }
      }
    }
  }
}

/**
 * Create a default callback handler
 */
export function createCallbackHandler(executionId?: string): CustomCallbackHandler {
  return new CustomCallbackHandler(executionId);
}

/**
 * Create a callback manager
 */
export function createCallbackManager(): CallbackManagerImpl {
  return new CallbackManagerImpl();
}

