/**
 * Structured Output Parser
 * 
 * Uses LangChain's StructuredOutputParser to parse structured outputs
 */

import { StructuredOutputParser } from "langchain/output_parsers";
import { OutputFixingParser } from "langchain/output_parsers";
import { createAIMLClient } from "../client";

/**
 * Parse structured output from LLM response
 */
export interface StructuredParserConfig {
  schema: Record<string, any>; // JSON schema or Zod schema
  formatInstructions?: string;
  autoFix?: boolean; // Use OutputFixingParser if parsing fails
}

/**
 * Create a structured output parser
 */
export function createStructuredParser(config: StructuredParserConfig) {
  const parser = StructuredOutputParser.fromNamesAndDescriptions(
    Object.entries(config.schema).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
      return acc;
    }, {} as Record<string, string>)
  );

  if (config.autoFix) {
    const llm = createAIMLClient({ temperature: 0 });
    return OutputFixingParser.fromLLM(llm, parser);
  }

  return parser;
}

/**
 * Parse LLM response to structured format
 */
export async function parseStructuredOutput(
  response: string,
  config: StructuredParserConfig
): Promise<any> {
  try {
    const parser = createStructuredParser(config);
    const result = await parser.parse(response);
    return result;
  } catch (error: any) {
    // Try to extract JSON from response if direct parsing fails
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        throw new Error(`Failed to parse structured output: ${error.message}`);
      }
    }
    throw error;
  }
}

/**
 * Get format instructions for structured output
 */
export function getFormatInstructions(config: StructuredParserConfig): string {
  const parser = createStructuredParser({ ...config, autoFix: false });
  return parser.getFormatInstructions();
}

