/**
 * Multi-Agent System - Shared Context
 * 
 * Manages shared context storage for multi-agent execution
 */

/**
 * Shared context storage
 * Stores data that can be accessed by all agents in a multi-agent execution
 */
class SharedContext {
  private context: Map<string, Record<string, any>> = new Map();

  /**
   * Get context for an execution
   */
  get(executionId: string): Record<string, any> {
    return this.context.get(executionId) || {};
  }

  /**
   * Set a value in context
   */
  set(executionId: string, key: string, value: any): void {
    const context = this.context.get(executionId) || {};
    context[key] = value;
    this.context.set(executionId, context);
  }

  /**
   * Get a specific value from context
   */
  getValue(executionId: string, key: string): any {
    const context = this.get(executionId);
    return context[key];
  }

  /**
   * Update context with multiple values
   */
  update(executionId: string, updates: Record<string, any>): void {
    const context = this.get(executionId);
    Object.assign(context, updates);
    this.context.set(executionId, context);
  }

  /**
   * Clear context for an execution
   */
  clear(executionId: string): void {
    this.context.delete(executionId);
  }

  /**
   * Check if a key exists in context
   */
  has(executionId: string, key: string): boolean {
    const context = this.get(executionId);
    return key in context;
  }

  /**
   * Get all keys in context
   */
  keys(executionId: string): string[] {
    const context = this.get(executionId);
    return Object.keys(context);
  }

  /**
   * Remove a specific key from context
   */
  remove(executionId: string, key: string): void {
    const context = this.get(executionId);
    if (context) {
      delete context[key];
      this.context.set(executionId, context);
    }
  }
}

// Singleton instance
export const sharedContext = new SharedContext();

