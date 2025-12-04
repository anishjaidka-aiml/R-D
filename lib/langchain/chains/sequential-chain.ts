/**
 * Sequential Chain
 * 
 * Chains multiple LLM calls together, passing output from one to the next
 * Each chain can use variables from previous chains
 */

import { PromptTemplate } from "@langchain/core/prompts";
import { createAIMLClient } from "../client";

export interface SequentialChainStep {
  name: string; // Step identifier
  prompt: string; // Prompt template
  inputVariables?: string[]; // Variables this step expects (from previous steps or initial input)
  outputKey?: string; // Key to store output under (defaults to step name)
  temperature?: number;
  modelName?: string;
}

export interface SequentialChainConfig {
  steps: SequentialChainStep[];
  initialInput?: Record<string, any>; // Initial input variables
  temperature?: number; // Default temperature for all steps
  modelName?: string; // Default model for all steps
}

export interface SequentialChainResult {
  outputs: Record<string, string>; // Outputs from each step, keyed by outputKey
  finalOutput: string; // Output from the last step
  steps: Array<{
    name: string;
    input: Record<string, any>;
    output: string;
  }>;
}

/**
 * Execute a Sequential Chain
 * 
 * Example:
 * ```typescript
 * const result = await executeSequentialChain({
 *   initialInput: { topic: "AI agents" },
 *   steps: [
 *     {
 *       name: "outline",
 *       prompt: "Create an outline for an article about {topic}",
 *       inputVariables: ["topic"],
 *     },
 *     {
 *       name: "draft",
 *       prompt: "Write a draft article based on this outline:\n{outline}",
 *       inputVariables: ["outline"],
 *     },
 *   ],
 * });
 * ```
 */
export async function executeSequentialChain(
  config: SequentialChainConfig
): Promise<SequentialChainResult> {
  try {
    console.log(`🔗 Executing Sequential Chain`);
    console.log(`  Steps: ${config.steps.length}`);
    console.log(`  Initial input:`, config.initialInput || {});

    const outputs: Record<string, string> = {};
    const stepResults: Array<{ name: string; input: Record<string, any>; output: string }> = [];

    // Start with initial input
    let currentVariables: Record<string, any> = { ...(config.initialInput || {}) };

    // Execute each step sequentially
    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i];
      const outputKey = step.outputKey || step.name;

      console.log(`\n  📍 Step ${i + 1}/${config.steps.length}: ${step.name}`);
      console.log(`     Prompt: ${step.prompt.substring(0, 100)}...`);

      // Build input variables for this step
      const stepInput: Record<string, any> = {};
      
      if (step.inputVariables) {
        // Use specified input variables
        for (const varName of step.inputVariables) {
          if (varName in currentVariables) {
            stepInput[varName] = currentVariables[varName];
          } else {
            console.warn(`  ⚠️  Variable "${varName}" not found in current variables`);
          }
        }
      } else {
        // Use all current variables
        Object.assign(stepInput, currentVariables);
      }

      console.log(`     Input variables:`, stepInput);

      // Create prompt template
      const template = PromptTemplate.fromTemplate(step.prompt);
      const formattedPrompt = await template.format(stepInput);

      // Create LLM client
      const llm = createAIMLClient({
        temperature: step.temperature ?? config.temperature ?? 0.7,
        modelName: step.modelName ?? config.modelName,
      });

      // Invoke LLM
      const response = await llm.invoke(formattedPrompt);
      const stepOutput = String(response.content);

      // Store output
      outputs[outputKey] = stepOutput;
      currentVariables[outputKey] = stepOutput; // Make available to next steps

      stepResults.push({
        name: step.name,
        input: stepInput,
        output: stepOutput,
      });

      console.log(`     ✅ Output: ${stepOutput.substring(0, 100)}...`);
    }

    const finalOutput = outputs[config.steps[config.steps.length - 1].outputKey || config.steps[config.steps.length - 1].name];

    console.log(`\n  ✅ Sequential Chain completed`);
    console.log(`     Final output: ${finalOutput.substring(0, 100)}...`);

    return {
      outputs,
      finalOutput,
      steps: stepResults,
    };
  } catch (error: any) {
    console.error("❌ Sequential Chain execution failed:", error);
    throw new Error(`Sequential Chain failed: ${error.message}`);
  }
}


