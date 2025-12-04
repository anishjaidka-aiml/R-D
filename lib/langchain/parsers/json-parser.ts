/**
 * JSON Output Parser
 * 
 * Simple JSON parser with error handling and fixing
 */

import { OutputFixingParser } from "langchain/output_parsers";
import { BaseOutputParser } from "@langchain/core/output_parsers";
import { createAIMLClient } from "../client";

/**
 * JSON Output Parser class
 */
class JSONOutputParser extends BaseOutputParser<Record<string, any>> {
  async parse(text: string): Promise<Record<string, any>> {
    try {
      // Try to extract JSON from text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, try parsing entire text
      return JSON.parse(text);
    } catch (error: any) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }

  getFormatInstructions(): string {
    return `Your response must be valid JSON. Return only the JSON object, no additional text.`;
  }
}

/**
 * Create a JSON parser with optional auto-fixing
 */
export function createJSONParser(autoFix: boolean = false) {
  const parser = new JSONOutputParser();

  if (autoFix) {
    const llm = createAIMLClient({ temperature: 0 });
    return OutputFixingParser.fromLLM(llm, parser);
  }

  return parser;
}

/**
 * Parse JSON from LLM response
 */
export async function parseJSON(
  response: string,
  autoFix: boolean = false
): Promise<Record<string, any>> {
  const parser = createJSONParser(autoFix);
  return parser.parse(response);
}

