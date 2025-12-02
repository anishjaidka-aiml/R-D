/**
 * Improved Agent Executor
 * 
 * Alternative approaches to get tool calling working with AI.ML
 */

import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { AgentConfig, AgentExecutionResult } from "@/types/agent";
import { aimlModel, createAIMLClient } from "./client";
import { getTools } from "./tools";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

/**
 * Approach 1: Manual tool calling with prompt engineering
 * (Fallback if function calling doesn't work)
 */
export async function executeAgentWithPromptEngineering(
  prompt: string,
  config: Partial<AgentConfig> = {}
): Promise<AgentExecutionResult> {
  const startTime = Date.now();

  try {
    console.log("🔧 Using Prompt Engineering Approach");

    const llm = createAIMLClient({
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens,
    });

    const tools = config.tools && config.tools.length > 0 ? getTools(config.tools) : [];
    
    // Build tool descriptions for prompt
    const toolDescriptions = tools.map(tool => {
      return `- ${tool.name}: ${tool.description}`;
    }).join('\n');

    // Create system prompt with tool instructions
    const systemPrompt = `${config.systemPrompt || 'You are a helpful assistant.'}

You have access to these tools:
${toolDescriptions}

To use a tool, respond EXACTLY in this format:
TOOL: tool_name
PARAMS: {"param1": "value1"}

After using a tool, I will give you the result and you can decide to use another tool or give a final answer.
When you're done using tools, start your response with ANSWER: followed by your final response.`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(prompt),
    ];

    let iterations = 0;
    const maxIterations = 10;
    const toolCalls: any[] = [];
    const reasoning: string[] = [];

    while (iterations < maxIterations) {
      const response = await llm.invoke(messages);
      const content = String(response.content);

      console.log(`\nIteration ${iterations + 1}:`);
      console.log("Response:", content);

      // Check if agent wants to use a tool
      if (content.includes('TOOL:') && content.includes('PARAMS:')) {
        const toolMatch = content.match(/TOOL:\s*(\w+)/);
        const paramsMatch = content.match(/PARAMS:\s*(\{[^}]+\})/);

        if (toolMatch && paramsMatch) {
          const toolName = toolMatch[1];
          const params = JSON.parse(paramsMatch[1]);

          console.log(`🛠️ Agent wants to use tool: ${toolName}`);
          console.log(`📝 Parameters:`, params);

          // Find and execute tool
          const tool = tools.find(t => t.name === toolName);
          if (tool) {
            const result = await tool.func(params);
            
            toolCalls.push({
              toolName,
              parameters: params,
              result: JSON.parse(result),
              timestamp: new Date().toISOString(),
            });

            reasoning.push(`Used ${toolName} with params ${JSON.stringify(params)}`);

            // Add tool result to conversation
            messages.push(response);
            messages.push(new HumanMessage(`TOOL RESULT: ${result}\n\nWhat's next?`));

            iterations++;
            continue;
          }
        }
      }

      // Check if agent is giving final answer
      if (content.includes('ANSWER:')) {
        const answer = content.split('ANSWER:')[1].trim();
        
        return {
          success: true,
          output: answer,
          reasoning,
          toolCalls,
          executionTime: Date.now() - startTime,
        };
      }

      // If no tool call and no final answer, this is the final response
      return {
        success: true,
        output: content,
        reasoning,
        toolCalls,
        executionTime: Date.now() - startTime,
      };
    }

    throw new Error('Max iterations reached');
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Approach 2: Try with explicit tool format
 */
export async function executeAgentWithExplicitTools(
  prompt: string,
  config: Partial<AgentConfig> = {}
): Promise<AgentExecutionResult> {
  const startTime = Date.now();

  try {
    console.log("🔧 Using Explicit Tool Format Approach");

    const llm = new ChatOpenAI({
      modelName: config.model || process.env.AIML_MODEL || "llama-3.3-70b-instruct",
      temperature: config.temperature || 0.1,
      openAIApiKey: process.env.AIML_API_KEY,
      configuration: {
        baseURL: process.env.AIML_BASE_URL,
      },
      // Force JSON mode for better structured responses
      modelKwargs: {
        response_format: { type: "json_object" }
      }
    });

    const tools = config.tools && config.tools.length > 0 ? getTools(config.tools) : [];
    
    const toolSchemas = tools.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: (tool as any).schema?._def?.shape ? 
            Object.entries((tool as any).schema._def.shape).reduce((acc: any, [key, val]: [string, any]) => {
              acc[key] = { type: val._def.typeName.toLowerCase().replace('zod', '') };
              return acc;
            }, {}) : {},
        }
      }
    }));

    console.log("Tool schemas:", JSON.stringify(toolSchemas, null, 2));

    const response = await llm.invoke(
      [
        new SystemMessage(config.systemPrompt || "You are a helpful assistant with access to tools."),
        new HumanMessage(prompt)
      ],
      {
        tools: toolSchemas,
      }
    );

    console.log("Response:", response);
    console.log("Additional kwargs:", response.additional_kwargs);

    return {
      success: true,
      output: String(response.content),
      toolCalls: [],
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime,
    };
  }
}

