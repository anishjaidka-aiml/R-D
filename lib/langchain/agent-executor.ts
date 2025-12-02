/**
 * Agent Executor
 * 
 * Core agent execution logic using LangChain
 * 
 * Note: Since AI.ML doesn't support OpenAI function calling format,
 * we use a manual/prompt-engineering approach for tool calling.
 */

import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { aimlModel, createAIMLClient } from "./client";
import { getTools } from "./tools";
import { AgentConfig, AgentExecutionResult } from "@/types/agent";
import { executeManualAgent } from "./agent-manual";
import type { CallbackHandler } from "@/types/callbacks";

/**
 * Execute an agent with LangChain
 * 
 * Since AI.ML doesn't support function calling, we use manual/prompt-engineering approach
 */
export async function executeAgent(
  prompt: string,
  config: Partial<AgentConfig> = {},
  callbackHandler?: CallbackHandler
): Promise<AgentExecutionResult> {
  console.log("🤖 Executing Agent...");
  console.log(`  Approach: Manual/Prompt Engineering (AI.ML doesn't support function calling)`);
  console.log(`  Prompt: ${prompt.substring(0, 100)}...`);
  console.log(`  Tools: ${config.tools?.join(', ') || 'none'}`);

  // Use manual agent executor (works without function calling support)
  return executeManualAgent(prompt, config, callbackHandler);
}

/**
 * Test agent with a simple query
 */
export async function testAgent(): Promise<AgentExecutionResult> {
  return executeAgent(
    "What is 25 * 17? Calculate it and tell me the answer.",
    {
      tools: ['calculator'],
      systemPrompt: "You are a helpful math assistant. Use the calculator tool to perform calculations.",
    }
  );
}

