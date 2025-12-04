/**
 * Multi-Agent System - Multi-Agent Executor
 * 
 * Executes multiple agents in parallel, sequential, or supervised mode
 */

import { executeManualAgent } from '../agent-manual';
import { agentRegistry } from './agent-registry';
import { analyzeTask } from './supervisor';
import { sharedContext } from './shared-context';
import { sendMessage, broadcastMessage } from './communication';
import {
  AgentDefinition,
  AgentContext,
  AgentExecutionResult,
  MultiAgentExecutionResult,
  SupervisorDecision,
} from './agent-types';
import type { AgentConfig } from '@/types/agent';
import type { CallbackHandler } from '@/types/callbacks';

/**
 * Execute a single agent
 */
async function executeAgent(
  agent: AgentDefinition,
  context: AgentContext,
  executionId: string,
  callbackHandler?: CallbackHandler
): Promise<AgentExecutionResult> {
  const startTime = Date.now();

  try {
    console.log(`\n🤖 Executing agent: ${agent.name} (${agent.id})`);
    console.log(`   Task: ${context.task.substring(0, 100)}...`);

    // Build agent prompt with context
    let prompt = context.task;

    // Add shared context if available
    if (context.sharedContext && Object.keys(context.sharedContext).length > 0) {
      prompt += `\n\nShared Context:\n${JSON.stringify(context.sharedContext, null, 2)}`;
    }

    // Add previous results if available
    if (context.previousResults && Object.keys(context.previousResults).length > 0) {
      prompt += `\n\nPrevious Results:\n${JSON.stringify(context.previousResults, null, 2)}`;
    }

    // Add messages if available
    if (context.messages && context.messages.length > 0) {
      const relevantMessages = context.messages
        .filter(m => m.to === agent.id || m.to === 'broadcast')
        .map(m => `From ${m.from}: ${m.content}`)
        .join('\n');
      if (relevantMessages) {
        prompt += `\n\nMessages:\n${relevantMessages}`;
      }
    }

    // Build agent config
    const agentConfig: Partial<AgentConfig> = {
      systemPrompt: agent.systemPrompt,
      tools: agent.tools,
      temperature: agent.temperature,
      model: agent.model,
      maxTokens: agent.maxTokens,
    };

    // Execute agent
    const result = await executeManualAgent(prompt, agentConfig, callbackHandler);

    // Broadcast completion message
    broadcastMessage(
      agent.id,
      `Completed task: ${result.output.substring(0, 100)}...`,
      executionId,
      { success: result.success }
    );

    const executionTime = Date.now() - startTime;

    return {
      agentId: agent.id,
      agentName: agent.name,
      success: result.success,
      output: result.output,
      reasoning: result.reasoning,
      toolCalls: result.toolCalls,
      executionTime,
      error: result.error,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Agent ${agent.id} execution failed:`, error);

    // Broadcast error message
    broadcastMessage(
      agent.id,
      `Error: ${error.message}`,
      executionId,
      { error: true }
    );

    return {
      agentId: agent.id,
      agentName: agent.name,
      success: false,
      output: '',
      executionTime,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Execute agents in parallel
 */
async function executeParallel(
  agents: AgentDefinition[],
  task: string,
  executionId: string,
  sharedContextData?: Record<string, any>,
  callbackHandler?: CallbackHandler
): Promise<Record<string, AgentExecutionResult>> {
  console.log(`\n🔄 Executing ${agents.length} agents in parallel...`);

  const contexts: AgentContext[] = agents.map(agent => ({
    agentId: agent.id,
    task,
    sharedContext: sharedContextData,
  }));

  // Execute all agents in parallel
  const promises = agents.map((agent, index) =>
    executeAgent(agent, contexts[index], executionId, callbackHandler)
  );

  const results = await Promise.all(promises);

  // Convert to record
  const resultsRecord: Record<string, AgentExecutionResult> = {};
  results.forEach(result => {
    resultsRecord[result.agentId] = result;
  });

  return resultsRecord;
}

/**
 * Execute agents sequentially
 */
async function executeSequential(
  agents: AgentDefinition[],
  task: string,
  executionId: string,
  taskBreakdown?: Array<{ agent: string; subtask: string }>,
  sharedContextData?: Record<string, any>,
  callbackHandler?: CallbackHandler
): Promise<Record<string, AgentExecutionResult>> {
  console.log(`\n🔄 Executing ${agents.length} agents sequentially...`);

  const results: Record<string, AgentExecutionResult> = {};
  let previousResults: Record<string, any> = {};

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    
    // Get task for this agent
    const agentTask = taskBreakdown?.find(t => t.agent === agent.id)?.subtask || task;

    const context: AgentContext = {
      agentId: agent.id,
      task: agentTask,
      sharedContext: sharedContextData,
      previousResults,
    };

    // Execute agent
    const result = await executeAgent(agent, context, executionId, callbackHandler);
    results[agent.id] = result;

    // Update previous results for next agent
    previousResults[agent.id] = {
      output: result.output,
      success: result.success,
    };

    // Update shared context
    if (sharedContextData) {
      sharedContext.set(executionId, agent.id, result.output);
    }

    // If agent failed, decide whether to continue
    if (!result.success && i < agents.length - 1) {
      console.warn(`⚠️  Agent ${agent.id} failed, but continuing with remaining agents...`);
    }
  }

  return results;
}

/**
 * Execute multi-agent system
 */
export async function executeMultiAgent(
  task: string,
  config: {
    mode: 'supervised' | 'parallel' | 'sequential';
    agentIds?: string[];
    supervisorDecision?: SupervisorDecision;
    sharedContext?: Record<string, any>;
    temperature?: number;
    model?: string;
  } = { mode: 'supervised' },
  callbackHandler?: CallbackHandler
): Promise<MultiAgentExecutionResult> {
  const startTime = Date.now();
  const executionId = `multi-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`\n🚀 Starting Multi-Agent Execution`);
  console.log(`   Execution ID: ${executionId}`);
  console.log(`   Mode: ${config.mode}`);
  console.log(`   Task: ${task.substring(0, 100)}...`);

  try {
    // Initialize shared context
    if (config.sharedContext) {
      sharedContext.update(executionId, config.sharedContext);
    }

    let supervisorDecision: SupervisorDecision | undefined = config.supervisorDecision;
    let agents: AgentDefinition[] = [];

    // Determine which agents to use
    if (config.mode === 'supervised') {
      // Use supervisor to analyze task
      if (!supervisorDecision) {
        console.log('🤖 Supervisor analyzing task...');
        supervisorDecision = await analyzeTask(
          task,
          config.agentIds,
          {
            temperature: config.temperature,
            model: config.model,
          }
        );
      }

      // Get agent definitions
      agents = supervisorDecision.selectedAgents
        .map(id => agentRegistry.get(id))
        .filter((agent): agent is AgentDefinition => agent !== undefined);

      if (agents.length === 0) {
        throw new Error('No valid agents found for execution');
      }
    } else if (config.agentIds && config.agentIds.length > 0) {
      // Use specified agents
      agents = config.agentIds
        .map(id => agentRegistry.get(id))
        .filter((agent): agent is AgentDefinition => agent !== undefined);

      if (agents.length === 0) {
        throw new Error('No valid agents found in agentIds');
      }
    } else {
      throw new Error('agentIds required for parallel or sequential mode');
    }

    console.log(`   Agents: ${agents.map(a => a.name).join(', ')}`);

    // Execute agents based on mode
    let results: Record<string, AgentExecutionResult>;
    const executionMode = supervisorDecision?.executionMode || config.mode === 'parallel' ? 'parallel' : 'sequential';

    if (executionMode === 'parallel') {
      results = await executeParallel(
        agents,
        task,
        executionId,
        config.sharedContext,
        callbackHandler
      );
    } else {
      results = await executeSequential(
        agents,
        task,
        executionId,
        supervisorDecision?.taskBreakdown,
        config.sharedContext,
        callbackHandler
      );
    }

    // Aggregate results
    const successfulResults = Object.values(results).filter(r => r.success);
    const aggregatedOutput = successfulResults
      .map(r => `[${r.agentName}]\n${r.output}`)
      .join('\n\n---\n\n');

    const executionTime = Date.now() - startTime;

    console.log(`\n✅ Multi-Agent Execution Complete`);
    console.log(`   Duration: ${executionTime}ms`);
    console.log(`   Successful agents: ${successfulResults.length}/${agents.length}`);

    // Clean up shared context
    sharedContext.clear(executionId);

    return {
      executionId,
      mode: config.mode,
      success: successfulResults.length > 0,
      results,
      aggregatedOutput,
      supervisorDecision,
      executionTime,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Multi-Agent Execution Failed:`, error);

    // Clean up shared context
    sharedContext.clear(executionId);

    return {
      executionId,
      mode: config.mode,
      success: false,
      results: {},
      aggregatedOutput: '',
      executionTime,
      error: error.message || 'Unknown error',
    };
  }
}

