/**
 * Router Chain
 * 
 * Routes to different chains based on input conditions
 * Uses an LLM to determine which chain to execute
 */

import { PromptTemplate } from "@langchain/core/prompts";
import { createAIMLClient } from "../client";
import { executeLLMChain, LLMChainConfig } from "./llm-chain";
import { executeSequentialChain, SequentialChainConfig } from "./sequential-chain";

export type ChainType = 'llm' | 'sequential';

export interface RouterDestination {
  name: string; // Destination identifier
  description: string; // Description of when to route here
  chainType: ChainType;
  chainConfig: LLMChainConfig | SequentialChainConfig;
}

export interface RouterChainConfig {
  routingPrompt: string; // Prompt to determine routing (should ask LLM to return destination name)
  destinations: RouterDestination[];
  defaultDestination?: string; // Fallback if routing fails
  input?: Record<string, any>; // Input variables
  temperature?: number;
  modelName?: string;
}

export interface RouterChainResult {
  selectedDestination: string;
  destinationDescription: string;
  chainResult: any;
  routingDecision: string; // LLM's reasoning for routing decision
}

/**
 * Execute a Router Chain
 * 
 * Example:
 * ```typescript
 * const result = await executeRouterChain({
 *   routingPrompt: "Based on this query: {query}, which destination should we use?",
 *   input: { query: "Write a professional email" },
 *   destinations: [
 *     {
 *       name: "email",
 *       description: "For email-related tasks",
 *       chainType: "llm",
 *       chainConfig: {
 *         prompt: "Write a professional email about {query}",
 *         variables: { query: "{query}" },
 *       },
 *     },
 *     {
 *       name: "code",
 *       description: "For code generation tasks",
 *       chainType: "llm",
 *       chainConfig: {
 *         prompt: "Generate code for {query}",
 *         variables: { query: "{query}" },
 *       },
 *     },
 *   ],
 * });
 * ```
 */
export async function executeRouterChain(
  config: RouterChainConfig
): Promise<RouterChainResult> {
  try {
    console.log(`🔀 Executing Router Chain`);
    console.log(`  Destinations: ${config.destinations.length}`);
    console.log(`  Input:`, config.input || {});

    // Build routing prompt with destination options
    const destinationList = config.destinations
      .map((dest, idx) => `${idx + 1}. ${dest.name}: ${dest.description}`)
      .join('\n');

    const routingPromptTemplate = `${config.routingPrompt}

Available destinations:
${destinationList}

Respond with ONLY the destination name (e.g., "email" or "code"). Do not include any explanation.`;

    console.log(`  Routing prompt: ${routingPromptTemplate.substring(0, 200)}...`);

    // Create routing prompt template
    const routingTemplate = PromptTemplate.fromTemplate(routingPromptTemplate);
    const formattedRoutingPrompt = await routingTemplate.format(config.input || {});

    // Use LLM to determine routing
    const routingLLM = createAIMLClient({
      temperature: config.temperature ?? 0.3, // Lower temperature for more consistent routing
      modelName: config.modelName,
    });

    const routingResponse = await routingLLM.invoke(formattedRoutingPrompt);
    const routingDecision = String(routingResponse.content).trim().toLowerCase();

    console.log(`  🎯 Routing decision: "${routingDecision}"`);

    // Find matching destination
    let selectedDestination = config.destinations.find(
      (dest) => dest.name.toLowerCase() === routingDecision
    );

    // If no exact match, try partial match
    if (!selectedDestination) {
      selectedDestination = config.destinations.find(
        (dest) => routingDecision.includes(dest.name.toLowerCase()) || dest.name.toLowerCase().includes(routingDecision)
      );
    }

    // Fallback to default or first destination
    if (!selectedDestination) {
      if (config.defaultDestination) {
        selectedDestination = config.destinations.find(
          (dest) => dest.name === config.defaultDestination
        );
      }
      if (!selectedDestination) {
        selectedDestination = config.destinations[0];
        console.warn(`  ⚠️  No matching destination found, using first: ${selectedDestination.name}`);
      }
    }

    if (!selectedDestination) {
      throw new Error("No destinations available");
    }

    console.log(`  ✅ Selected destination: ${selectedDestination.name}`);
    console.log(`     Description: ${selectedDestination.description}`);

    // Execute the selected chain
    let chainResult: any;

    if (selectedDestination.chainType === 'llm') {
      const llmConfig = selectedDestination.chainConfig as LLMChainConfig;
      // Merge input variables into chain config
      const mergedConfig: LLMChainConfig = {
        ...llmConfig,
        variables: {
          ...llmConfig.variables,
          ...config.input,
        },
      };
      chainResult = await executeLLMChain(mergedConfig);
    } else if (selectedDestination.chainType === 'sequential') {
      const seqConfig = selectedDestination.chainConfig as SequentialChainConfig;
      // Merge input variables into chain config
      const mergedConfig: SequentialChainConfig = {
        ...seqConfig,
        initialInput: {
          ...seqConfig.initialInput,
          ...config.input,
        },
      };
      chainResult = await executeSequentialChain(mergedConfig);
    } else {
      throw new Error(`Unsupported chain type: ${selectedDestination.chainType}`);
    }

    console.log(`  ✅ Chain execution completed`);

    return {
      selectedDestination: selectedDestination.name,
      destinationDescription: selectedDestination.description,
      chainResult,
      routingDecision,
    };
  } catch (error: any) {
    console.error("❌ Router Chain execution failed:", error);
    throw new Error(`Router Chain failed: ${error.message}`);
  }
}

