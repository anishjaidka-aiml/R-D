import { NextResponse } from 'next/server';
import { createEmbeddingClient } from '@/lib/langchain/embeddings/embedding-client';
import { SimpleTextEmbeddings } from '@/lib/langchain/embeddings/simple-embeddings';

/**
 * API Route to test embeddings with AI.ML API
 * 
 * GET /api/test-embeddings
 * 
 * Tests if AI.ML API supports embeddings endpoint
 */
export async function GET() {
  const results: {
    step: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    details?: any;
  }[] = [];

  try {
    // Step 1: Check API keys
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL; // Optional - for Baseten or custom endpoints
    const AIML_API_KEY = process.env.AIML_API_KEY;
    const AIML_BASE_URL = process.env.AIML_BASE_URL || "https://api.aimlapi.com/v1";

    const USE_OPENAI = !!OPENAI_API_KEY;
    const USE_AIML = !USE_OPENAI && !!AIML_API_KEY;

    if (!OPENAI_API_KEY && !AIML_API_KEY) {
      results.push({
        step: 'API Key Check',
        status: 'error',
        message: 'Neither OPENAI_API_KEY nor AIML_API_KEY found in environment variables',
      });
      return NextResponse.json({
        success: false,
        results,
        conclusion: 'No API key configured',
      }, { status: 500 });
    }

    if (USE_OPENAI) {
      const isBaseten = OPENAI_BASE_URL?.includes('baseten.co') || OPENAI_BASE_URL?.includes('inference.baseten');
      const provider = isBaseten ? 'Baseten' : 'OpenAI';
      const baseUrl = OPENAI_BASE_URL || 'https://api.openai.com/v1 (default)';
      
      results.push({
        step: 'API Key Check',
        status: 'success',
        message: `OPENAI_API_KEY found - Using ${provider} API ${isBaseten ? '(OpenAI-compatible)' : '(best for embeddings)'}`,
        details: {
          provider,
          keyLength: OPENAI_API_KEY.length,
          baseUrl,
          isBaseten,
        },
      });
    } else if (USE_AIML) {
      results.push({
        step: 'API Key Check',
        status: 'warning',
        message: 'AIML_API_KEY found - Using AI.ML API (may not support embeddings)',
        details: {
          provider: 'AI.ML',
          keyLength: AIML_API_KEY.length,
          baseUrl: AIML_BASE_URL,
        },
      });
    }

    // Step 2: Try to create embedding client
    let embeddingClient;
    try {
      embeddingClient = createEmbeddingClient();
      results.push({
        step: 'Create Embedding Client',
        status: 'success',
        message: 'Embedding client created successfully',
      });
    } catch (error: any) {
      results.push({
        step: 'Create Embedding Client',
        status: 'error',
        message: `Failed to create embedding client: ${error.message}`,
        details: error,
      });
      return NextResponse.json({
        success: false,
        results,
        conclusion: 'Failed to create embedding client',
      }, { status: 500 });
    }

    // Step 3: Test embedding query
    const testText = "This is a test sentence for embeddings.";
    try {
      console.log('🧪 Testing embedding query...');
      // Use the client we just created (not the cached one)
      const embedding = await embeddingClient.embedQuery(testText);
      
      results.push({
        step: 'Test Embedding Query',
        status: 'success',
        message: `Successfully created embedding!`,
        details: {
          text: testText,
          embeddingLength: embedding.length,
          embeddingPreview: embedding.slice(0, 5),
          embeddingType: typeof embedding[0],
        },
      });

      // Step 4: Test embedding documents
      const testDocuments = [
        "First test document about AI.",
        "Second test document about machine learning.",
      ];
      
      try {
        const embeddings = await embeddingClient.embedDocuments(testDocuments);
        results.push({
          step: 'Test Embedding Documents',
          status: 'success',
          message: `Successfully created embeddings for ${testDocuments.length} documents!`,
          details: {
            documentCount: testDocuments.length,
            embeddingsCount: embeddings.length,
            embeddingDimensions: embeddings[0]?.length,
          },
        });
      } catch (docError: any) {
        results.push({
          step: 'Test Embedding Documents',
          status: 'error',
          message: `Failed to create document embeddings: ${docError.message}`,
          details: {
            error: docError.message,
            status: docError.status,
            code: docError.code,
          },
        });
      }

      return NextResponse.json({
        success: true,
        results,
        conclusion: '✅ AI.ML Embeddings API is WORKING!',
        embeddingType: 'AI.ML API (Real Embeddings)',
      }, { status: 200 });

    } catch (error: any) {
      // Check error type and which API was used
      const is400Error = 
        error.status === 400 || 
        error.code === 'BadRequestError' ||
        error.message?.includes('400') ||
        (error.status && error.status >= 400 && error.status < 500);
      
      const usedOpenAI = USE_OPENAI;
      const usedAIML = USE_AIML;

      if (is400Error) {
        let errorMessage = 'Embeddings API returned 400 Bad Request';
        if (usedOpenAI) {
          errorMessage += ' - OpenAI API error (check API key, model, or base URL)';
        } else if (usedAIML) {
          errorMessage += ' - AI.ML likely does NOT support embeddings endpoint';
        }
        
        results.push({
          step: 'Test Embedding Query',
          status: 'error',
          message: errorMessage,
          details: {
            provider: usedOpenAI ? 'OpenAI' : (usedAIML ? 'AI.ML' : 'Unknown'),
            error: error.message,
            status: error.status,
            code: error.code,
            fullError: error.toString(),
            apiKeyPresent: usedOpenAI ? 'OPENAI_API_KEY' : (usedAIML ? 'AIML_API_KEY' : 'None'),
          },
        });

        // Test fallback
        try {
          const fallbackEmbeddings = new SimpleTextEmbeddings();
          const fallbackResult = await fallbackEmbeddings.embedQuery(testText);
          results.push({
            step: 'Fallback Test',
            status: 'success',
            message: 'Fallback (SimpleTextEmbeddings) works correctly',
            details: {
              fallbackType: 'SimpleTextEmbeddings',
              embeddingLength: fallbackResult.length,
            },
          });
        } catch (fallbackError: any) {
          results.push({
            step: 'Fallback Test',
            status: 'error',
            message: `Fallback also failed: ${fallbackError.message}`,
          });
        }

        return NextResponse.json({
          success: false,
          results,
          conclusion: '❌ AI.ML Embeddings API is NOT supported. Using fallback system.',
          embeddingType: 'SimpleTextEmbeddings (Fallback)',
        }, { status: 200 }); // 200 because fallback works
      } else {
        results.push({
          step: 'Test Embedding Query',
          status: 'error',
          message: `Unexpected error: ${error.message}`,
          details: {
            error: error.message,
            status: error.status,
            code: error.code,
            fullError: error.toString(),
          },
        });

        return NextResponse.json({
          success: false,
          results,
          conclusion: 'Unknown error occurred',
        }, { status: 500 });
      }
    }
  } catch (error: any) {
    results.push({
      step: 'General Error',
      status: 'error',
      message: `Unexpected error: ${error.message}`,
      details: error,
    });

    return NextResponse.json({
      success: false,
      results,
      conclusion: 'Test failed with unexpected error',
    }, { status: 500 });
  }
}

