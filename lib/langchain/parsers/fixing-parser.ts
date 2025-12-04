/**
 * Output Fixing Parser
 * 
 * Automatically fixes malformed outputs using LLM
 */

import { OutputFixingParser } from "langchain/output_parsers";
import { BaseOutputParser } from "@langchain/core/output_parsers";
import { createAIMLClient } from "../client";

/**
 * Create an output fixing parser wrapper
 */
export function createFixingParser<T>(
  baseParser: BaseOutputParser<T>,
  options?: {
    temperature?: number;
    maxRetries?: number;
  }
): OutputFixingParser<T> {
  const llm = createAIMLClient({
    temperature: options?.temperature ?? 0,
  });

  return OutputFixingParser.fromLLM(llm, baseParser);
}

/**
 * Parse with automatic fixing and retry
 */
export async function parseWithFixing<T>(
  text: string,
  parser: BaseOutputParser<T>,
  options?: {
    temperature?: number;
    maxRetries?: number;
  }
): Promise<T> {
  const fixingParser = createFixingParser(parser, options);
  const maxRetries = options?.maxRetries ?? 3;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fixingParser.parse(text);
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        console.warn(`Parse attempt ${attempt + 1} failed, retrying...`);
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  throw lastError || new Error('Failed to parse output after retries');
}

