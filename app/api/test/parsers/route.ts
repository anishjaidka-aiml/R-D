/**
 * Test Output Parsers API
 * 
 * GET /api/test/parsers - Run all parser tests
 * POST /api/test/parsers - Test specific parser
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeAgent } from '@/lib/langchain/agent-executor';

/**
 * GET - Run all parser tests
 */
export async function GET(request: NextRequest) {
  const results = {
    jsonParser: null as any,
    structuredParser: null as any,
    withoutParser: null as any,
    autoFix: null as any,
  };

  try {
    // Test 1: JSON Parser
    try {
      const result1 = await executeAgent(
        'Return a JSON object with name: "John Doe", age: 30, and city: "New York". Make sure it\'s valid JSON.',
        {
          outputParser: {
            type: 'json',
            autoFix: true,
          },
        }
      );
      results.jsonParser = {
        success: true,
        rawOutput: result1.output,
        parsedOutput: result1.parsedOutput,
        executionTime: result1.executionTime,
      };
    } catch (error: any) {
      results.jsonParser = {
        success: false,
        error: error.message,
      };
    }

    // Test 2: Structured Parser
    try {
      const result2 = await executeAgent(
        'Extract information: "Sarah Johnson is 28 years old, lives in San Francisco, email sarah@example.com, works as Engineer"',
        {
          outputParser: {
            type: 'structured',
            schema: {
              name: 'The person\'s full name',
              age: 'The person\'s age as a number',
              city: 'The city where the person lives',
              email: 'The person\'s email address',
              job: 'The person\'s job title',
            },
            autoFix: true,
          },
        }
      );
      results.structuredParser = {
        success: true,
        rawOutput: result2.output,
        parsedOutput: result2.parsedOutput,
        executionTime: result2.executionTime,
      };
    } catch (error: any) {
      results.structuredParser = {
        success: false,
        error: error.message,
      };
    }

    // Test 3: Without Parser
    try {
      const result3 = await executeAgent('Tell me a short joke.');
      results.withoutParser = {
        success: true,
        output: result3.output,
        parsedOutput: result3.parsedOutput, // Should be undefined
        executionTime: result3.executionTime,
      };
    } catch (error: any) {
      results.withoutParser = {
        success: false,
        error: error.message,
      };
    }

    // Test 4: Auto-Fix
    try {
      const result4 = await executeAgent(
        'Return JSON: {status: "ok", count: 42}',
        {
          outputParser: {
            type: 'json',
            autoFix: true,
          },
        }
      );
      results.autoFix = {
        success: true,
        rawOutput: result4.output,
        parsedOutput: result4.parsedOutput,
        executionTime: result4.executionTime,
      };
    } catch (error: any) {
      results.autoFix = {
        success: false,
        error: error.message,
      };
    }

    return NextResponse.json({
      success: true,
      tests: results,
      summary: {
        total: 4,
        passed: Object.values(results).filter((r: any) => r?.success).length,
        failed: Object.values(results).filter((r: any) => !r?.success).length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Test specific parser
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, parserConfig } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const result = await executeAgent(prompt, {
      outputParser: parserConfig,
    });

    return NextResponse.json({
      success: true,
      rawOutput: result.output,
      parsedOutput: result.parsedOutput,
      executionTime: result.executionTime,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

