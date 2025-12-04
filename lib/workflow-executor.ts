/**
 * Workflow Executor
 * 
 * Executes workflows by traversing nodes and running their logic
 */

import { Workflow, WorkflowExecution, ExecutionLog, WorkflowNode } from '@/types/workflow';
import { executeAgent } from './langchain/agent-executor';
import { executeConversationalAgent } from './langchain/agent-manual';
import { generateConversationId } from './langchain/memory-manager';
import { aimlModel } from './langchain/client';
import { resolveVariables, resolveVariablesInObject } from './variable-resolver';
import { executeLLMChain, LLMChainConfig } from './langchain/chains/llm-chain';
import { executeSequentialChain, SequentialChainConfig } from './langchain/chains/sequential-chain';
import { executeRouterChain, RouterChainConfig } from './langchain/chains/router-chain';
import { executeMultiAgent } from './langchain/agents/multi-agent-executor';

export class WorkflowExecutor {
  private workflow: Workflow;
  private execution: WorkflowExecution;
  private context: Record<string, any> = {};

  constructor(workflow: Workflow, triggerData?: any) {
    this.workflow = workflow;
    this.execution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: workflow.id,
      status: 'pending',
      logs: [],
      startTime: new Date().toISOString(),
      triggerData,
    };

    // Initialize context with trigger data
    if (triggerData) {
      this.context['trigger'] = triggerData;
    }
  }

  /**
   * Execute the entire workflow
   */
  async execute(): Promise<WorkflowExecution> {
    try {
      console.log(`\n🚀 Starting workflow execution: ${this.workflow.name}`);
      console.log(`   Workflow ID: ${this.workflow.id}`);
      console.log(`   Execution ID: ${this.execution.id}`);

      this.execution.status = 'running';

      // Find trigger node
      const triggerNode = this.workflow.nodes.find(n => n.data.type === 'trigger');
      if (!triggerNode) {
        throw new Error('No trigger node found in workflow');
      }

      console.log(`   Starting from trigger node: ${triggerNode.id}`);

      // Execute from trigger
      await this.executeNode(triggerNode.id);

      this.execution.status = 'success';
      this.execution.endTime = new Date().toISOString();

      console.log(`✅ Workflow completed successfully`);
      console.log(`   Duration: ${new Date(this.execution.endTime).getTime() - new Date(this.execution.startTime).getTime()}ms\n`);
    } catch (error: any) {
      this.execution.status = 'error';
      this.execution.endTime = new Date().toISOString();
      console.error(`❌ Workflow execution failed:`, error);
    }

    return this.execution;
  }

  /**
   * Execute a single node
   */
  private async executeNode(nodeId: string, visited: Set<string> = new Set()): Promise<any> {
    // Prevent infinite loops
    if (visited.has(nodeId)) {
      console.warn(`⚠️  Node ${nodeId} already visited, skipping to prevent loop`);
      return null;
    }
    visited.add(nodeId);

    const node = this.workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      console.warn(`⚠️  Node ${nodeId} not found`);
      return null;
    }

    const log: ExecutionLog = {
      nodeId: node.id,
      nodeName: node.data.label,
      status: 'running',
      startTime: new Date().toISOString(),
    };

    this.execution.logs.push(log);

    console.log(`\n  📦 Executing node: ${node.data.label} (${node.data.type})`);

    try {
      let output: any;

      // Execute based on node type
      switch (node.data.type) {
        case 'trigger':
          output = await this.executeTrigger(node);
          break;
        case 'agent':
          output = await this.executeAgentNode(node);
          break;
        case 'llm':
          output = await this.executeLLMNode(node);
          break;
        case 'llm_chain':
          output = await this.executeLLMChainNode(node);
          break;
        case 'sequential_chain':
          output = await this.executeSequentialChainNode(node);
          break;
        case 'router_chain':
          output = await this.executeRouterChainNode(node);
          break;
        case 'multi_agent':
          output = await this.executeMultiAgentNode(node);
          break;
        case 'condition':
          output = await this.executeCondition(node);
          break;
        default:
          output = { message: `Node type ${node.data.type} not yet implemented` };
      }

      log.output = output;
      log.status = 'success';
      log.endTime = new Date().toISOString();
      log.duration = new Date(log.endTime).getTime() - new Date(log.startTime).getTime();

      // Store output in context
      this.context[node.id] = output;
      // Also store by node label for easier reference (if label exists)
      if (node.data.label) {
        const labelKey = node.data.label.toLowerCase().replace(/\s+/g, '_');
        this.context[labelKey] = output;
      }

      console.log(`  ✅ Node completed in ${log.duration}ms`);
      console.log(`     Output:`, JSON.stringify(output).substring(0, 100) + '...');

      // Find and execute next nodes
      await this.executeNextNodes(nodeId, output, visited);

      return output;
    } catch (error: any) {
      log.status = 'error';
      log.error = error.message;
      log.endTime = new Date().toISOString();
      log.duration = new Date(log.endTime).getTime() - new Date(log.startTime).getTime();

      console.error(`  ❌ Node failed: ${error.message}`);

      throw error;
    }
  }

  /**
   * Execute trigger node
   */
  private async executeTrigger(node: WorkflowNode): Promise<any> {
    const config = node.data.config;

    // PRIORITY 1: Use execution trigger data (from execute form) - HIGHEST PRIORITY
    if (this.execution.triggerData) {
      console.log('     Using execution trigger data (from form)');
      return this.execution.triggerData;
    }

    // PRIORITY 2: Use node config trigger data (hardcoded in node)
    if (config.triggerData) {
      console.log('     Using node config trigger data (hardcoded)');
      // Try to parse if it's a string
      if (typeof config.triggerData === 'string') {
        try {
          return JSON.parse(config.triggerData);
        } catch (e) {
          return { data: config.triggerData };
        }
      }
      return config.triggerData;
    }

    // PRIORITY 3: Default fallback
    console.log('     Using default trigger data');
    return { message: 'Workflow started' };
  }

  /**
   * Execute AI agent node
   */
  private async executeAgentNode(node: WorkflowNode): Promise<any> {
    const config = node.data.config;

    // Resolve variables in prompt
    const prompt = resolveVariables(config.prompt || '', this.context);
    const systemPrompt = resolveVariables(config.systemPrompt || '', this.context);

    console.log(`     Agent prompt: ${prompt.substring(0, 100)}...`);
    console.log(`     Tools: ${config.tools?.join(', ') || 'none'}`);
    console.log(`     Memory enabled: ${config.enableMemory ? 'YES' : 'NO'}`);

    // Check if memory is enabled
    if (config.enableMemory) {
      // Use conversational agent with memory
      const conversationId = config.conversationId || generateConversationId();
      console.log(`     🧠 Using memory with conversation ID: ${conversationId}`);

      const result = await executeConversationalAgent(prompt, conversationId, {
        tools: config.tools || [],
        systemPrompt: systemPrompt || undefined,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });

      if (!result.success) {
        throw new Error(result.error || 'Agent execution failed');
      }

      return {
        output: result.output,
        reasoning: result.reasoning,
        toolCalls: result.toolCalls,
        executionTime: result.executionTime,
        conversationId: result.conversationId,
      };
    }

    // Execute agent without memory (standard)
    const result = await executeAgent(prompt, {
      tools: config.tools || [],
      systemPrompt: systemPrompt || undefined,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    if (!result.success) {
      throw new Error(result.error || 'Agent execution failed');
    }

    return {
      output: result.output,
      reasoning: result.reasoning,
      toolCalls: result.toolCalls,
      executionTime: result.executionTime,
    };
  }

  /**
   * Execute simple LLM node
   */
  private async executeLLMNode(node: WorkflowNode): Promise<any> {
    const config = node.data.config;

    // Resolve variables in prompt
    const prompt = resolveVariables(config.prompt || '', this.context);

    console.log(`     LLM prompt: ${prompt.substring(0, 100)}...`);

    // Call LLM
    const response = await aimlModel.invoke(prompt);

    return {
      output: response.content,
      prompt: prompt,
    };
  }

  /**
   * Execute LLM Chain node
   */
  private async executeLLMChainNode(node: WorkflowNode): Promise<any> {
    const config = node.data.config;

    // Resolve variables in prompt template
    const promptTemplate = resolveVariables(config.promptTemplate || '', this.context);
    
    // Build variables object from config and context
    const variables: Record<string, any> = {};
    if (config.variables) {
      for (const [key, value] of Object.entries(config.variables)) {
        variables[key] = resolveVariables(String(value), this.context);
      }
    }
    // Also include context variables
    Object.assign(variables, this.context);

    console.log(`     LLM Chain prompt template: ${promptTemplate.substring(0, 100)}...`);
    console.log(`     Variables:`, variables);

    const chainConfig: LLMChainConfig = {
      prompt: promptTemplate,
      variables,
      temperature: config.temperature,
      modelName: config.modelName,
      maxTokens: config.maxTokens,
    };

    const result = await executeLLMChain(chainConfig);

    return {
      output: result.output,
      variables: result.variables,
      chainType: 'llm_chain',
    };
  }

  /**
   * Execute Sequential Chain node
   */
  private async executeSequentialChainNode(node: WorkflowNode): Promise<any> {
    const config = node.data.config;

    console.log(`     Sequential Chain with ${config.steps?.length || 0} steps`);

    // Build steps from config
    const steps = (config.steps || []).map((step: any) => ({
      name: step.name || `step_${Math.random().toString(36).substr(2, 9)}`,
      prompt: resolveVariables(step.prompt || '', this.context),
      inputVariables: step.inputVariables || [],
      outputKey: step.outputKey,
      temperature: step.temperature,
      modelName: step.modelName,
    }));

    // Build initial input from config and context
    const initialInput: Record<string, any> = {};
    if (config.initialInput) {
      for (const [key, value] of Object.entries(config.initialInput)) {
        initialInput[key] = resolveVariables(String(value), this.context);
      }
    }
    // Also include context variables
    Object.assign(initialInput, this.context);

    const chainConfig: SequentialChainConfig = {
      steps,
      initialInput,
      temperature: config.temperature,
      modelName: config.modelName,
    };

    const result = await executeSequentialChain(chainConfig);

    return {
      output: result.finalOutput,
      outputs: result.outputs,
      steps: result.steps,
      chainType: 'sequential_chain',
    };
  }

  /**
   * Execute Router Chain node
   */
  private async executeRouterChainNode(node: WorkflowNode): Promise<any> {
    const config = node.data.config;

    console.log(`     Router Chain with ${config.destinations?.length || 0} destinations`);

    // Resolve variables in routing prompt
    const routingPrompt = resolveVariables(config.routingPrompt || '', this.context);

    // Build destinations from config
    const destinations = (config.destinations || []).map((dest: any) => ({
      name: dest.name,
      description: dest.description || '',
      chainType: dest.chainType || 'llm',
      chainConfig: dest.chainConfig || {},
    }));

    // Build input from config and context
    const input: Record<string, any> = {};
    if (config.input) {
      for (const [key, value] of Object.entries(config.input)) {
        input[key] = resolveVariables(String(value), this.context);
      }
    }
    // Also include context variables
    Object.assign(input, this.context);

    const chainConfig: RouterChainConfig = {
      routingPrompt,
      destinations,
      defaultDestination: config.defaultDestination,
      input,
      temperature: config.temperature,
      modelName: config.modelName,
    };

    const result = await executeRouterChain(chainConfig);

    return {
      output: result.chainResult.output || result.chainResult.finalOutput,
      selectedDestination: result.selectedDestination,
      destinationDescription: result.destinationDescription,
      routingDecision: result.routingDecision,
      chainResult: result.chainResult,
      chainType: 'router_chain',
    };
  }

  /**
   * Execute multi-agent node
   */
  private async executeMultiAgentNode(node: WorkflowNode): Promise<any> {
    const config = node.data.config;

    console.log(`     Multi-Agent execution mode: ${config.mode || 'supervised'}`);

    // Resolve variables in task
    const task = resolveVariables(config.task || '', this.context);

    // Get agent IDs
    const agentIds = config.agentIds || [];

    // Get shared context
    const sharedContext = config.sharedContext ? resolveVariablesInObject(config.sharedContext, this.context) : undefined;

    // Build multi-agent config
    const multiAgentConfig = {
      mode: config.mode || 'supervised',
      agentIds: agentIds.length > 0 ? agentIds : undefined,
      sharedContext,
      temperature: config.temperature,
      model: config.model,
    };

    const result = await executeMultiAgent(task, multiAgentConfig);

    return {
      output: result.aggregatedOutput,
      results: result.results,
      supervisorDecision: result.supervisorDecision,
      executionId: result.executionId,
      mode: result.mode,
      success: result.success,
      executionTime: result.executionTime,
      error: result.error,
      chainType: 'multi_agent',
    };
  }

  /**
   * Execute condition node
   */
  private async executeCondition(node: WorkflowNode): Promise<any> {
    const config = node.data.config;

    // Resolve variables
    const leftValue = resolveVariables(config.leftValue || '', this.context);
    const rightValue = resolveVariables(config.rightValue || '', this.context);
    const operator = config.operator || '==';

    console.log(`     Condition: ${leftValue} ${operator} ${rightValue}`);

    let result = false;

    switch (operator) {
      case '==':
        result = leftValue == rightValue;
        break;
      case '!=':
        result = leftValue != rightValue;
        break;
      case '>':
        result = Number(leftValue) > Number(rightValue);
        break;
      case '<':
        result = Number(leftValue) < Number(rightValue);
        break;
      case 'contains':
        result = String(leftValue).includes(String(rightValue));
        break;
      default:
        result = false;
    }

    console.log(`     Result: ${result}`);

    return {
      result,
      leftValue,
      rightValue,
      operator,
    };
  }

  /**
   * Execute next nodes in the workflow
   */
  private async executeNextNodes(
    currentNodeId: string,
    currentOutput: any,
    visited: Set<string>
  ): Promise<void> {
    // Find edges from current node
    const nextEdges = this.workflow.edges.filter(e => e.source === currentNodeId);

    if (nextEdges.length === 0) {
      console.log(`     No more nodes to execute`);
      return;
    }

    // Get current node to check if it's a condition
    const currentNode = this.workflow.nodes.find(n => n.id === currentNodeId);
    const isCondition = currentNode?.data.type === 'condition';

    for (const edge of nextEdges) {
      // For condition nodes, only follow the appropriate path
      if (isCondition && currentOutput && typeof currentOutput === 'object' && 'result' in currentOutput) {
        const shouldExecute =
          (currentOutput.result && edge.sourceHandle === 'true') ||
          (!currentOutput.result && edge.sourceHandle === 'false');

        if (!shouldExecute) {
          console.log(`     Skipping edge to ${edge.target} (condition not met)`);
          continue;
        }
      }

      console.log(`     Following edge to next node: ${edge.target}`);
      await this.executeNode(edge.target, new Set(visited));
    }
  }

  /**
   * Get current execution state
   */
  getExecution(): WorkflowExecution {
    return this.execution;
  }

  /**
   * Get current context
   */
  getContext(): Record<string, any> {
    return this.context;
  }
}

