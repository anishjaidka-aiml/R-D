/**
 * LLM Chain
 * 
 * Simple chain: Prompt Template → LLM → Output
 * This is the most basic LangChain chain type
 */

import { PromptTemplate } from "@langchain/core/prompts";
import { createAIMLClient } from "../client";

export interface LLMChainConfig {
  prompt: string; // Prompt template with variables like {input}, {name}, etc.
  variables?: Record<string, any>; // Variables to substitute in prompt
  temperature?: number;
  modelName?: string;
  maxTokens?: number;
}

export interface LLMChainResult {
  output: string;
  variables?: Record<string, any>;
}

/**
 * Execute an LLM Chain
 * 
 * Example:
 * ```typescript
 * const result = await executeLLMChain({
 *   prompt: "Write a {tone} email about {topic}",
 *   variables: { tone: "professional", topic: "meeting" }
 * });
 * ```
 */
export async function executeLLMChain(
  config: LLMChainConfig
): Promise<LLMChainResult> {
  try {
    console.log(`🔗 Executing LLM Chain`);
    console.log(`  Prompt template: ${config.prompt.substring(0, 100)}...`);
    console.log(`  Variables:`, config.variables || {});

    // Create prompt template
    const template = PromptTemplate.fromTemplate(config.prompt);
    
    // Format prompt with variables
    const formattedPrompt = await template.format(config.variables || {});
    
    console.log(`  Formatted prompt: ${formattedPrompt.substring(0, 200)}...`);

    // Create LLM client
    const llm = createAIMLClient({
      temperature: config.temperature ?? 0.7,
      modelName: config.modelName,
      maxTokens: config.maxTokens,
    });

    // Invoke LLM
    const response = await llm.invoke(formattedPrompt);
    const output = String(response.content);

    console.log(`  ✅ LLM Chain output: ${output.substring(0, 100)}...`);

    return {
      output,
      variables: config.variables,
    };
  } catch (error: any) {
    console.error("❌ LLM Chain execution failed:", error);
    throw new Error(`LLM Chain failed: ${error.message}`);
  }
}


