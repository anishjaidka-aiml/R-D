import { ChatOpenAI } from "@langchain/openai";

/**
 * LLM Client Configuration
 * 
 * Supports:
 * - OpenAI API (direct)
 * - Baseten API (OpenAI-compatible, hosts GPT models like GPT-120B)
 * - AI.ML API (OpenAI-compatible)
 * 
 * Priority: OpenAI/Baseten API > AI.ML API
 */

// Check for OpenAI/Baseten API (priority)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL; // Required for Baseten, optional for OpenAI
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o"; // Default model (use "openai/gpt-oss-120b" for Baseten)

// Check for AI.ML API (fallback)
const AIML_API_KEY = process.env.AIML_API_KEY;
const AIML_BASE_URL = process.env.AIML_BASE_URL || "https://api.aimlapi.com/v1";
const AIML_MODEL = process.env.AIML_MODEL || "llama-3.3-70b-instruct";

// Determine which API to use
const USE_OPENAI = !!OPENAI_API_KEY;
const USE_AIML = !USE_OPENAI && !!AIML_API_KEY;

if (!OPENAI_API_KEY && !AIML_API_KEY) {
  console.warn("⚠️  Neither OPENAI_API_KEY nor AIML_API_KEY found in environment variables");
}

/**
 * Create LLM client
 * 
 * Priority: OpenAI API > AI.ML API
 * 
 * Usage:
 * ```typescript
 * import { aimlModel } from '@/lib/langchain/client';
 * const response = await aimlModel.invoke("Hello!");
 * ```
 */
export const aimlModel = USE_OPENAI
  ? (() => {
      const isBaseten = OPENAI_BASE_URL?.includes('baseten.co') || OPENAI_BASE_URL?.includes('inference.baseten');
      if (isBaseten) {
        console.log("✅ Using Baseten API for LLM (OpenAI-compatible)");
        console.log(`   Base URL: ${OPENAI_BASE_URL}`);
        console.log(`   Model: ${OPENAI_MODEL}`);
      }
      return new ChatOpenAI({
        modelName: OPENAI_MODEL,
        temperature: 0.7,
        openAIApiKey: OPENAI_API_KEY,
        ...(OPENAI_BASE_URL && {
          configuration: {
            baseURL: OPENAI_BASE_URL, // Required for Baseten
          },
        }),
        verbose: process.env.NODE_ENV === 'development',
      });
    })()
  : new ChatOpenAI({
      modelName: AIML_MODEL,
      temperature: 0.7,
      openAIApiKey: AIML_API_KEY,
      configuration: {
        baseURL: AIML_BASE_URL,
      },
      verbose: process.env.NODE_ENV === 'development',
    });

/**
 * Create a custom LLM client with specific configuration
 * 
 * Uses OpenAI API if available, otherwise falls back to AI.ML API
 */
export function createAIMLClient(config?: {
  temperature?: number;
  modelName?: string;
  maxTokens?: number;
}) {
  // Check fresh (not cached)
  const openaiKey = process.env.OPENAI_API_KEY;
  const openaiBaseUrl = process.env.OPENAI_BASE_URL;
  const openaiModel = process.env.OPENAI_MODEL || "gpt-4o";
  const aimlKey = process.env.AIML_API_KEY;
  const aimlBaseUrl = process.env.AIML_BASE_URL || "https://api.aimlapi.com/v1";
  const aimlModel = process.env.AIML_MODEL || "llama-3.3-70b-instruct";
  
  if (openaiKey) {
    const isBaseten = openaiBaseUrl?.includes('baseten.co') || openaiBaseUrl?.includes('inference.baseten');
    return new ChatOpenAI({
      modelName: config?.modelName || openaiModel,
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens,
      openAIApiKey: openaiKey,
      ...(openaiBaseUrl && {
        configuration: {
          baseURL: openaiBaseUrl,
        },
      }),
      verbose: process.env.NODE_ENV === 'development',
    });
  }
  
  return new ChatOpenAI({
    modelName: config?.modelName || aimlModel,
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens,
    openAIApiKey: aimlKey,
    configuration: {
      baseURL: aimlBaseUrl,
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
  provider?: string;
  response?: string;
}> {
  try {
    if (!OPENAI_API_KEY && !AIML_API_KEY) {
      return {
        success: false,
        message: "No API key configured. Please add OPENAI_API_KEY or AIML_API_KEY to .env.local",
      };
    }

    const provider = USE_OPENAI ? 'OpenAI' : 'AI.ML';
    const model = USE_OPENAI ? OPENAI_MODEL : AIML_MODEL;
    const baseUrl = USE_OPENAI ? (OPENAI_BASE_URL || 'https://api.openai.com/v1') : AIML_BASE_URL;

    console.log(`🔄 Testing connection to ${provider}...`);
    console.log(`📍 Base URL: ${baseUrl}`);
    console.log(`🤖 Model: ${model}`);

    const response = await aimlModel.invoke("Say 'Hello!' in one short sentence.");
    
    console.log("✅ Connection successful!");
    console.log(`📝 Response: ${response.content}`);

    return {
      success: true,
      message: `Successfully connected to ${provider}!`,
      provider,
      model,
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

