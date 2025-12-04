/**
 * Multi-Agent System - Communication
 * 
 * Handles message passing between agents
 */

import { AgentMessage } from './agent-types';

/**
 * Message bus for agent communication
 */
class AgentMessageBus {
  private messages: Map<string, AgentMessage[]> = new Map();
  private subscribers: Map<string, Set<(message: AgentMessage) => void>> = new Map();

  /**
   * Send a message
   */
  send(message: AgentMessage, executionId: string): void {
    const messages = this.messages.get(executionId) || [];
    messages.push(message);
    this.messages.set(executionId, messages);

    // Notify subscribers
    if (message.to === 'broadcast') {
      // Broadcast to all subscribers
      this.subscribers.forEach(callbacks => {
        callbacks.forEach(callback => callback(message));
      });
    } else {
      // Send to specific agent
      const callbacks = this.subscribers.get(message.to);
      if (callbacks) {
        callbacks.forEach(callback => callback(message));
      }
    }
  }

  /**
   * Get messages for an agent in an execution
   */
  getMessages(executionId: string, agentId?: string): AgentMessage[] {
    const messages = this.messages.get(executionId) || [];
    if (agentId) {
      return messages.filter(m => m.to === agentId || m.to === 'broadcast');
    }
    return messages;
  }

  /**
   * Subscribe to messages for an agent
   */
  subscribe(agentId: string, callback: (message: AgentMessage) => void): () => void {
    const callbacks = this.subscribers.get(agentId) || new Set();
    callbacks.add(callback);
    this.subscribers.set(agentId, callbacks);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(agentId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(agentId);
        }
      }
    };
  }

  /**
   * Clear messages for an execution
   */
  clear(executionId: string): void {
    this.messages.delete(executionId);
  }

  /**
   * Get all messages for an execution
   */
  getAllMessages(executionId: string): AgentMessage[] {
    return this.messages.get(executionId) || [];
  }
}

// Singleton instance
export const messageBus = new AgentMessageBus();

/**
 * Helper function to send a message
 */
export function sendMessage(
  from: string,
  to: string,
  content: string,
  executionId: string,
  metadata?: Record<string, any>
): void {
  const message: AgentMessage = {
    from,
    to,
    content,
    timestamp: Date.now(),
    metadata,
  };
  messageBus.send(message, executionId);
}

/**
 * Helper function to broadcast a message
 */
export function broadcastMessage(
  from: string,
  content: string,
  executionId: string,
  metadata?: Record<string, any>
): void {
  sendMessage(from, 'broadcast', content, executionId, metadata);
}

