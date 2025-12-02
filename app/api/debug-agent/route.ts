/**
 * Debug Agent Endpoint
 * 
 * Tests different approaches to get tool calling working with AI.ML
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

export async function POST(request: NextRequest) {
  try {
    const { testType } = await request.json();

    const llm = new ChatOpenAI({
      modelName: process.env.AIML_MODEL || "llama-3.3-70b-instruct",
      temperature: 0.1,
      openAIApiKey: process.env.AIML_API_KEY,
      configuration: {
        baseURL: process.env.AIML_BASE_URL,
      },
    });

    // Simple calculator tool
    const calculatorTool = new DynamicStructuredTool({
      name: "calculator",
      description: "Perform mathematical calculations. Input is a mathematical expression.",
      schema: z.object({
        expression: z.string().describe("Mathematical expression to evaluate"),
      }),
      func: async ({ expression }) => {
        console.log(`🔢 Calculator called with: ${expression}`);
        const result = Function(`'use strict'; return (${expression})`)();
        return JSON.stringify({ result });
      },
    });

    console.log("\n🔍 DEBUG TEST:", testType);

    // Test 1: Direct LLM call (no tools)
    if (testType === 'direct-llm') {
      console.log("Testing direct LLM call...");
      const response = await llm.invoke("What is 25 multiplied by 17? Just give me the number.");
      return NextResponse.json({
        testType,
        success: true,
        response: response.content,
      });
    }

    // Test 2: LLM with tool binding
    if (testType === 'tool-binding') {
      console.log("Testing LLM with tool binding...");
      const llmWithTools = llm.bind({
        functions: [
          {
            name: "calculator",
            description: "Perform mathematical calculations",
            parameters: {
              type: "object",
              properties: {
                expression: {
                  type: "string",
                  description: "Mathematical expression"
                }
              },
              required: ["expression"]
            }
          }
        ]
      });

      const response = await llmWithTools.invoke("Calculate 25 * 17. You must use the calculator function.");
      
      console.log("Response:", response);
      console.log("Additional kwargs:", response.additional_kwargs);
      
      return NextResponse.json({
        testType,
        success: true,
        response: response.content,
        additionalKwargs: response.additional_kwargs,
        hasToolCalls: !!response.additional_kwargs?.function_call || !!response.additional_kwargs?.tool_calls,
      });
    }

    // Test 3: Full agent with executor
    if (testType === 'full-agent') {
      console.log("Testing full agent executor...");
      
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", "You are a calculator assistant. You MUST use the calculator tool for any math. Never calculate mentally."],
        ["human", "{input}"],
        new MessagesPlaceholder("agent_scratchpad"),
      ]);

      const agent = await createOpenAIFunctionsAgent({
        llm,
        tools: [calculatorTool],
        prompt,
      });

      const executor = new AgentExecutor({
        agent,
        tools: [calculatorTool],
        verbose: true,
        returnIntermediateSteps: true,
        maxIterations: 5,
      });

      const result = await executor.invoke({
        input: "Use the calculator to compute 25 multiplied by 17. You must call the calculator tool.",
      });

      console.log("Agent result:", result);
      console.log("Intermediate steps:", result.intermediateSteps);

      return NextResponse.json({
        testType,
        success: true,
        output: result.output,
        intermediateSteps: result.intermediateSteps,
        hasToolCalls: result.intermediateSteps && result.intermediateSteps.length > 0,
      });
    }

    // Test 4: Check model capabilities
    if (testType === 'check-capabilities') {
      console.log("Checking model capabilities...");
      
      try {
        // Try to call with function format
        const response = await fetch(`${process.env.AIML_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.AIML_MODEL,
            messages: [
              { role: "user", content: "Say hello" }
            ],
            functions: [
              {
                name: "test_function",
                description: "A test function",
                parameters: {
                  type: "object",
                  properties: {
                    test: { type: "string" }
                  }
                }
              }
            ]
          })
        });

        const data = await response.json();
        
        return NextResponse.json({
          testType,
          success: response.ok,
          statusCode: response.status,
          supportsTools: !!data.choices?.[0]?.message?.function_call || !!data.choices?.[0]?.message?.tool_calls,
          rawResponse: data,
        });
      } catch (error: any) {
        return NextResponse.json({
          testType,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      error: 'Invalid test type. Use: direct-llm, tool-binding, full-agent, or check-capabilities'
    }, { status: 400 });

  } catch (error: any) {
    console.error("Debug test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

