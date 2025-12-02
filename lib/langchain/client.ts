import { ChatOpenAI } from "@langchain/openai";

/**
 * AI.ML LangChain Client Configuration
 * 
 * This configures LangChain to use your company's AI.ML API
 * as an OpenAI-compatible LLM provider.
 */

// Validate environment variables
const AIML_API_KEY = process.env.AIML_API_KEY;
const AIML_BASE_URL = process.env.AIML_BASE_URL || "https://api.aimlapi.com/v1";
const AIML_MODEL = process.env.AIML_MODEL || "llama-3.3-70b-instruct";

if (!AIML_API_KEY) {
  console.warn("⚠️  AIML_API_KEY not found in environment variables");
}

/**
 * Create AI.ML LangChain client
 * 
 * Usage:
 * ```typescript
 * import { aimlModel } from '@/lib/langchain/client';
 * const response = await aimlModel.invoke("Hello!");
 * ```
 */
export const aimlModel = new ChatOpenAI({
  modelName: AIML_MODEL,
  temperature: 0.7,
  openAIApiKey: AIML_API_KEY,
  configuration: {
    baseURL: AIML_BASE_URL,
  },
  verbose: process.env.NODE_ENV === 'development', // Show logs in dev mode
});

/**
 * Create a custom AI.ML client with specific configuration
 */
export function createAIMLClient(config?: {
  temperature?: number;
  modelName?: string;
  maxTokens?: number;
}) {
  return new ChatOpenAI({
    modelName: config?.modelName || AIML_MODEL,
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens,
    openAIApiKey: AIML_API_KEY,
    configuration: {
      baseURL: AIML_BASE_URL,
    },
    verbose: process.env.NODE_ENV === 'development',
  });
}

/**
 * Test connection to AI.ML API
 */
export async function testAIMLConnection(): Promise<{
  success: boolean;
  message: string;
  model?: string;
  response?: string;
}> {
  try {
    if (!AIML_API_KEY) {
      return {
        success: false,
        message: "AIML_API_KEY not configured. Please add it to .env.local",
      };
    }

    console.log("🔄 Testing connection to AI.ML...");
    console.log(`📍 Base URL: ${AIML_BASE_URL}`);
    console.log(`🤖 Model: ${AIML_MODEL}`);

    const response = await aimlModel.invoke("Say 'Hello from AI.ML!' in one short sentence.");
    
    console.log("✅ Connection successful!");
    console.log(`📝 Response: ${response.content}`);

    return {
      success: true,
      message: "Successfully connected to AI.ML!",
      model: AIML_MODEL,
      response: response.content as string,
    };
  } catch (error: any) {
    console.error("❌ Connection failed:", error);
    
    return {
      success: false,
      message: `Failed to connect: ${error.message || 'Unknown error'}`,
    };
  }
}

