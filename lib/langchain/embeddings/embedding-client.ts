/**
 * Embedding Client
 * 
 * Creates embeddings using OpenAI-compatible APIs:
 * - OpenAI API (direct)
 * - Baseten API (OpenAI-compatible, hosts GPT models)
 * - AI.ML API (OpenAI-compatible)
 * 
 * Priority:
 * 1. OpenAI API (if OPENAI_API_KEY is set) - Recommended for embeddings
 * 2. Baseten API (if OPENAI_BASE_URL points to Baseten) - OpenAI-compatible
 * 3. AI.ML API (if AIML_API_KEY is set) - May not support embeddings
 */

import { OpenAIEmbeddings } from "@langchain/openai";

// Check for OpenAI API key (priority)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AIML_API_KEY = process.env.AIML_API_KEY;
const AIML_BASE_URL = process.env.AIML_BASE_URL || "https://api.aimlapi.com/v1";

// Determine which API to use
const USE_OPENAI = !!OPENAI_API_KEY;
const USE_AIML = !USE_OPENAI && !!AIML_API_KEY;

if (!OPENAI_API_KEY && !AIML_API_KEY) {
  console.warn("⚠️  Neither OPENAI_API_KEY nor AIML_API_KEY found - embeddings will not work");
}

/**
 * Create embedding client
 * 
 * Priority: OpenAI API > AI.ML API
 * OpenAI API has reliable embeddings support
 * 
 * Note: Checks environment variables fresh each time (not cached at module load)
 */
export function createEmbeddingClient() {
  // Check environment variables fresh (not cached)
  const openaiKey = process.env.OPENAI_API_KEY;
  const aimlKey = process.env.AIML_API_KEY;
  const aimlBaseUrl = process.env.AIML_BASE_URL || "https://api.aimlapi.com/v1";
  const openaiBaseUrl = process.env.OPENAI_BASE_URL; // Optional custom OpenAI endpoint
  
  // Priority 1: Use OpenAI API if available (best for embeddings)
  if (openaiKey) {
    try {
      // Check if using Baseten (Baseten uses inference.baseten.co)
      const isBaseten = openaiBaseUrl?.includes('baseten.co') || openaiBaseUrl?.includes('inference.baseten');
      
      if (isBaseten) {
        console.log("✅ Using Baseten API for embeddings (OpenAI-compatible)");
      } else {
        console.log("✅ Using OpenAI API for embeddings");
      }
      
      const config: any = {
        openAIApiKey: openaiKey,
        modelName: "text-embedding-3-small", // OpenAI's latest embedding model
        maxRetries: 2,
      };
      
      // Add custom base URL if provided (required for Baseten)
      if (openaiBaseUrl) {
        config.configuration = {
          baseURL: openaiBaseUrl,
        };
        console.log(`   Using base URL: ${openaiBaseUrl}`);
      } else {
        console.log("   Using OpenAI default endpoint: https://api.openai.com/v1");
      }
      
      return new OpenAIEmbeddings(config);
    } catch (error: any) {
      console.error("Failed to create OpenAI/Baseten embedding client:", error);
      throw new Error(`Embedding client creation failed: ${error.message}`);
    }
  }
  
  // Priority 2: Use AI.ML API (OpenAI-compatible)
  if (aimlKey) {
    try {
      console.log("⚠️  Using AI.ML API for embeddings (may not be supported)");
      return new OpenAIEmbeddings({
        openAIApiKey: aimlKey,
        configuration: {
          baseURL: aimlBaseUrl, // Use base URL, LangChain will append /v1/embeddings
        },
        modelName: "text-embedding-ada-002", // Default embedding model
        maxRetries: 0, // Don't retry if embeddings aren't supported
      });
    } catch (error: any) {
      console.error("Failed to create AI.ML embedding client:", error);
      throw new Error(`AI.ML embedding client creation failed: ${error.message}. AI.ML may not support embeddings.`);
    }
  }
  
  throw new Error("No API key configured. Please set OPENAI_API_KEY or AIML_API_KEY in .env.local");
}

/**
 * Get embedding client instance
 * 
 * Always creates a fresh client to ensure latest environment variables are used
 * This is important because env vars might change after server restart
 */
function getEmbeddingClient(): OpenAIEmbeddings | null {
  const openaiKey = process.env.OPENAI_API_KEY;
  const aimlKey = process.env.AIML_API_KEY;
  
  if (!openaiKey && !aimlKey) {
    return null;
  }
  
  try {
    return createEmbeddingClient();
  } catch (error) {
    console.error("Failed to create embedding client:", error);
    return null;
  }
}

/**
 * Default embedding client instance (lazy getter)
 * 
 * Note: Always checks environment variables fresh
 */
export const embeddingClient = getEmbeddingClient();

/**
 * Create embeddings for text
 */
export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const client = getEmbeddingClient();
  if (!client) {
    throw new Error("Embedding client not initialized. Check OPENAI_API_KEY or AIML_API_KEY configuration.");
  }
  
  try {
    const embeddings = await client.embedDocuments(texts);
    return embeddings;
  } catch (error: any) {
    console.error("Failed to create embeddings:", error);
    throw new Error(`Embedding creation failed: ${error.message}`);
  }
}

/**
 * Create embedding for a single text
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const client = getEmbeddingClient();
  if (!client) {
    throw new Error("Embedding client not initialized. Check OPENAI_API_KEY or AIML_API_KEY configuration.");
  }
  
  try {
    const embedding = await client.embedQuery(text);
    return embedding;
  } catch (error: any) {
    console.error("Failed to create embedding:", error);
    throw new Error(`Embedding creation failed: ${error.message}`);
  }
}

