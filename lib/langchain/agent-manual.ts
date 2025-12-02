/**
 * Manual Agent Executor
 * 
 * Uses prompt engineering to enable tool calling when the LLM
 * doesn't support OpenAI function calling format.
 * 
 * This approach works with ANY LLM, including AI.ML models!
 */

import { createAIMLClient } from "./client";
import { getTools } from "./tools";
import { AgentConfig, AgentExecutionResult } from "@/types/agent";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { getConversationMemory, addToMemory, loadMemory } from "./memory-manager";
import type { BufferMemory, BufferWindowMemory } from "langchain/memory";
import { CustomCallbackHandler } from "./callbacks/custom-handler";
import type { CallbackHandler } from "@/types/callbacks";

/**
 * Execute agent using prompt engineering (no function calling needed)
 */
export async function executeManualAgent(
  prompt: string,
  config: Partial<AgentConfig> = {},
  callbackHandler?: CallbackHandler
): Promise<AgentExecutionResult> {
  const startTime = Date.now();
  const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log("\n🤖 Manual Agent Executor (Prompt Engineering Approach)");
    console.log(`   Prompt: ${prompt.substring(0, 100)}...`);
    console.log(`   Tools: ${config.tools?.join(', ') || 'none'}`);

    // Emit agent start callback
    if (callbackHandler?.handle) {
      await callbackHandler.handle({
        type: 'agent_start',
        timestamp: Date.now(),
        executionId,
        prompt,
        tools: config.tools,
        config: {
          temperature: config.temperature,
          model: config.model,
          maxTokens: config.maxTokens,
        },
      });
    }

    const llm = createAIMLClient({
      temperature: config.temperature || 0.1,
      maxTokens: config.maxTokens || 2000,
      modelName: config.model,
    });

    const tools = config.tools && config.tools.length > 0 ? getTools(config.tools) : [];

    if (tools.length === 0) {
      // No tools, just call LLM directly
      const llmStartTime = Date.now();
      
      if (callbackHandler?.handle) {
        await callbackHandler.handle({
          type: 'llm_start',
          timestamp: Date.now(),
          executionId,
          messages: 1,
        });
      }

      const response = await llm.invoke(prompt);
      const llmDuration = Date.now() - llmStartTime;
      const output = String(response.content);

      if (callbackHandler?.handle) {
        await callbackHandler.handle({
          type: 'llm_end',
          timestamp: Date.now(),
          executionId,
          response: output,
          duration: llmDuration,
        });

        await callbackHandler.handle({
          type: 'agent_end',
          timestamp: Date.now(),
          executionId,
          success: true,
          output,
          executionTime: Date.now() - startTime,
          toolCalls: 0,
        });

        await callbackHandler.handle({
          type: 'complete',
          timestamp: Date.now(),
          executionId,
          success: true,
          output,
          totalExecutionTime: Date.now() - startTime,
          totalIterations: 1,
          totalToolCalls: 0,
        });
      }

      return {
        success: true,
        output,
        toolCalls: [],
        reasoning: [],
        executionTime: Date.now() - startTime,
      };
    }

    // Build tool descriptions
    const toolDescriptions = tools.map(tool => {
      const name = tool.name;
      const desc = tool.description;
      // Get parameter info from Zod schema
      const params = (tool as any).schema?._def?.shape;
      const paramList = params ? Object.keys(params).join(', ') : 'none';
      return `  - ${name}(${paramList}): ${desc}`;
    }).join('\n');

    // Create system prompt with tool instructions
    const systemPrompt = `${config.systemPrompt || 'You are a helpful AI assistant.'}

You have access to these tools:
${toolDescriptions}

IMPORTANT INSTRUCTIONS:
1. When you need to use a tool, respond with EXACTLY this format:
   USE_TOOL: tool_name
   PARAMETERS: {"param1": "value1", "param2": "value2"}

2. I will execute the tool and give you the result
3. You can then use more tools or give a final answer
4. When you're ready to give the final answer, start with "FINAL_ANSWER: " followed by your response

Example:
If you need to calculate something, respond with:
USE_TOOL: calculator
PARAMETERS: {"expression": "45 * 23"}

Do NOT just describe using the tool - actually request it with the format above!`;

    const messages: any[] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(prompt),
    ];

    let iterations = 0;
    const maxIterations = 10;
    const toolCalls: any[] = [];
    const reasoning: string[] = [];
    let finalOutput = '';

    console.log("🔄 Starting agent reasoning loop...");

    while (iterations < maxIterations) {
      iterations++;
      console.log(`\n  📍 Iteration ${iterations}/${maxIterations}`);

      const response = await llm.invoke(messages);
      const content = String(response.content).trim();

      console.log(`  💬 Agent response: ${content.substring(0, 150)}...`);

      // Check if agent wants to use a tool
      if (content.includes('USE_TOOL:') && content.includes('PARAMETERS:')) {
        console.log(`  🛠️  Agent requesting tool...`);

        // Extract tool name
        const toolMatch = content.match(/USE_TOOL:\s*(\w+)/i);
        // Extract parameters (find JSON object)
        const paramsMatch = content.match(/PARAMETERS:\s*(\{[^}]*\})/i);

        if (toolMatch && paramsMatch) {
          const toolName = toolMatch[1].toLowerCase();
          let params;
          
          try {
            params = JSON.parse(paramsMatch[1]);
          } catch (e) {
            console.error(`  ❌ Failed to parse parameters: ${paramsMatch[1]}`);
            messages.push(new AIMessage(content));
            messages.push(new HumanMessage("Error: Invalid parameter format. Please provide valid JSON."));
            continue;
          }

          console.log(`  ✅ Tool: ${toolName}`);
          console.log(`  📝 Params:`, params);

          // Find and execute tool
          const tool = tools.find(t => t.name === toolName);
          
          if (!tool) {
            console.log(`  ❌ Tool not found: ${toolName}`);
            messages.push(new AIMessage(content));
            messages.push(new HumanMessage(`Error: Tool '${toolName}' not available. Available tools: ${tools.map(t => t.name).join(', ')}`));
            continue;
          }

          // Execute tool
          const toolStartTime = Date.now();
          
          // Emit tool start callback
          if (callbackHandler?.handle) {
            await callbackHandler.handle({
              type: 'tool_start',
              timestamp: Date.now(),
              executionId,
              toolName,
              parameters: params,
              iteration: iterations,
            });
          }

          try {
            const result = await tool.func(params);
            const toolDuration = Date.now() - toolStartTime;
            const parsedResult = JSON.parse(result);
            
            console.log(`  ✅ Tool result: ${result.substring(0, 100)}...`);

            // Record tool call
            toolCalls.push({
              toolName,
              parameters: params,
              result: parsedResult,
              timestamp: new Date().toISOString(),
            });

            reasoning.push(`Used ${toolName} with ${JSON.stringify(params)}`);

            // Emit tool end callback
            if (callbackHandler?.handle) {
              await callbackHandler.handle({
                type: 'tool_end',
                timestamp: Date.now(),
                executionId,
                toolName,
                result: parsedResult,
                duration: toolDuration,
                success: true,
              });

              await callbackHandler.handle({
                type: 'iteration_end',
                timestamp: Date.now(),
                executionId,
                iteration: iterations,
                action: 'tool_call',
              });
            }

            // Add to conversation
            messages.push(new AIMessage(content));
            messages.push(new HumanMessage(`TOOL_RESULT: ${result}\n\nYou can now use another tool or give your final answer.`));

            continue;
          } catch (error: any) {
            const toolDuration = Date.now() - toolStartTime;
            console.error(`  ❌ Tool execution error:`, error);

            // Emit tool error callback
            if (callbackHandler?.handle) {
              await callbackHandler.handle({
                type: 'tool_end',
                timestamp: Date.now(),
                executionId,
                toolName,
                result: null,
                duration: toolDuration,
                success: false,
              });

              await callbackHandler.handle({
                type: 'error',
                timestamp: Date.now(),
                executionId,
                error: error.message,
                errorType: 'tool_error',
                context: { toolName, parameters: params },
              });
            }

            messages.push(new AIMessage(content));
            messages.push(new HumanMessage(`Tool execution error: ${error.message}`));
            continue;
          }
        }
      }

      // Check if agent is giving final answer
      if (content.includes('FINAL_ANSWER:')) {
        finalOutput = content.split('FINAL_ANSWER:')[1].trim();
        console.log(`  🎯 Final answer: ${finalOutput.substring(0, 100)}...`);
        
        if (callbackHandler?.handle) {
          await callbackHandler.handle({
            type: 'iteration_end',
            timestamp: Date.now(),
            executionId,
            iteration: iterations,
            action: 'final_answer',
          });
        }
        break;
      }

      // If no tool call and no final answer marker, treat as final answer
      if (iterations > 1 || !content.includes('USE_TOOL')) {
        finalOutput = content;
        console.log(`  🎯 Treating as final answer`);
        
        if (callbackHandler?.handle) {
          await callbackHandler.handle({
            type: 'iteration_end',
            timestamp: Date.now(),
            executionId,
            iteration: iterations,
            action: 'final_answer',
          });
        }
        break;
      }

      // Safety: if agent just talks without using format, guide it
      messages.push(new AIMessage(content));
      messages.push(new HumanMessage("Please use the exact format: USE_TOOL: tool_name and PARAMETERS: {...} or start with FINAL_ANSWER: if you're done."));
    }

    console.log(`\n✅ Agent completed after ${iterations} iterations`);
    console.log(`   Tools used: ${toolCalls.length}`);
    console.log(`   Final output: ${finalOutput.substring(0, 100)}...`);

    const executionTime = Date.now() - startTime;
    const result = {
      success: true,
      output: finalOutput || "Agent completed but no output generated",
      reasoning,
      toolCalls,
      executionTime,
    };

    // Emit completion callbacks
    if (callbackHandler?.handle) {
      await callbackHandler.handle({
        type: 'agent_end',
        timestamp: Date.now(),
        executionId,
        success: true,
        output: result.output,
        executionTime,
        toolCalls: toolCalls.length,
      });

      await callbackHandler.handle({
        type: 'complete',
        timestamp: Date.now(),
        executionId,
        success: true,
        output: result.output,
        totalExecutionTime: executionTime,
        totalIterations: iterations,
        totalToolCalls: toolCalls.length,
      });
    }

    return result;
  } catch (error: any) {
    console.error("❌ Manual agent error:", error);
    
    // Emit error callback
    if (callbackHandler?.handle) {
      await callbackHandler.handle({
        type: 'error',
        timestamp: Date.now(),
        executionId,
        error: error.message,
        errorType: 'execution_error',
      });

      await callbackHandler.handle({
        type: 'agent_end',
        timestamp: Date.now(),
        executionId,
        success: false,
        executionTime: Date.now() - startTime,
        toolCalls: 0,
      });
    }

    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Execute agent WITH MEMORY (conversational)
 * 
 * This enables multi-turn conversations where the agent remembers context
 */
export async function executeConversationalAgent(
  prompt: string,
  conversationId: string,
  config: Partial<AgentConfig> = {},
  callbackHandler?: CallbackHandler
): Promise<AgentExecutionResult> {
  const startTime = Date.now();
  const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log("\n🧠 Conversational Agent Executor (With Memory)");
    console.log(`   Conversation ID: ${conversationId}`);
    console.log(`   Prompt: ${prompt.substring(0, 100)}...`);
    console.log(`   Tools: ${config.tools?.join(', ') || 'none'}`);

    // Emit agent start callback
    if (callbackHandler?.handle) {
      await callbackHandler.handle({
        type: 'agent_start',
        timestamp: Date.now(),
        executionId,
        prompt,
        tools: config.tools,
        config: {
          temperature: config.temperature,
          model: config.model,
          maxTokens: config.maxTokens,
        },
      });
    }

    const llm = createAIMLClient({
      temperature: config.temperature || 0.1,
      maxTokens: config.maxTokens || 2000,
      modelName: config.model,
    });

    const tools = config.tools && config.tools.length > 0 ? getTools(config.tools) : [];

    // Get memory for this conversation
    const memory = getConversationMemory(conversationId, {
      type: "buffer_window",
      windowSize: 10, // Keep last 10 messages
      returnMessages: true,
    });

    // Load chat history
    const memoryVariables = await memory.loadMemoryVariables({});
    const chatHistory: BaseMessage[] = memoryVariables.chat_history || [];
    
    console.log(`   💾 Loaded ${chatHistory.length} previous messages from memory`);

    // Build tool descriptions if tools are available
    let toolSection = '';
    if (tools.length > 0) {
      const toolDescriptions = tools.map(tool => {
        const name = tool.name;
        const desc = tool.description;
        const params = (tool as any).schema?._def?.shape;
        const paramList = params ? Object.keys(params).join(', ') : 'none';
        return `  - ${name}(${paramList}): ${desc}`;
      }).join('\n');

      toolSection = `
You have access to these tools:
${toolDescriptions}

TOOL USAGE INSTRUCTIONS:
1. When you need to use a tool, respond with EXACTLY this format:
   USE_TOOL: tool_name
   PARAMETERS: {"param1": "value1", "param2": "value2"}

2. I will execute the tool and give you the result
3. You can then use more tools or give a final answer
4. When you're ready to give the final answer, start with "FINAL_ANSWER: " followed by your response

Example:
USE_TOOL: calculator
PARAMETERS: {"expression": "45 * 23"}

Do NOT just describe using the tool - actually request it with the format above!`;
    }

    // Create system prompt
    const systemPrompt = `${config.systemPrompt || 'You are a helpful AI assistant with memory. You remember the conversation history and can reference previous messages.'}
${toolSection}

Remember: You can refer to previous messages in this conversation. The user expects you to remember context.`;

    // Build message history
    const messages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      ...chatHistory, // Include conversation history!
      new HumanMessage(prompt),
    ];

    let iterations = 0;
    const maxIterations = 10;
    const toolCalls: any[] = [];
    const reasoning: string[] = [];
    let finalOutput = '';

    console.log("🔄 Starting conversational agent reasoning loop...");

    // If no tools, just call LLM directly with memory
    if (tools.length === 0) {
      const llmStartTime = Date.now();
      
      if (callbackHandler?.handle) {
        await callbackHandler.handle({
          type: 'llm_start',
          timestamp: Date.now(),
          executionId,
          messages: messages.length,
        });
      }

      const response = await llm.invoke(messages);
      const llmDuration = Date.now() - llmStartTime;
      finalOutput = String(response.content);
      
      if (callbackHandler?.handle) {
        await callbackHandler.handle({
          type: 'llm_end',
          timestamp: Date.now(),
          executionId,
          response: finalOutput,
          duration: llmDuration,
        });

        await callbackHandler.handle({
          type: 'agent_end',
          timestamp: Date.now(),
          executionId,
          success: true,
          output: finalOutput,
          executionTime: Date.now() - startTime,
          toolCalls: 0,
        });

        await callbackHandler.handle({
          type: 'complete',
          timestamp: Date.now(),
          executionId,
          success: true,
          output: finalOutput,
          totalExecutionTime: Date.now() - startTime,
          totalIterations: 1,
          totalToolCalls: 0,
        });
      }
      
      // Save to memory
      await memory.saveContext(
        { input: prompt },
        { output: finalOutput }
      );
      
      console.log(`✅ Response generated and saved to memory`);
      
      return {
        success: true,
        output: finalOutput,
        toolCalls: [],
        reasoning: [],
        executionTime: Date.now() - startTime,
        conversationId,
      };
    }

    // Agent loop with tools
    while (iterations < maxIterations) {
      iterations++;
      console.log(`\n  📍 Iteration ${iterations}/${maxIterations}`);

      // Emit iteration start callback
      if (callbackHandler?.handle) {
        await callbackHandler.handle({
          type: 'iteration_start',
          timestamp: Date.now(),
          executionId,
          iteration: iterations,
          maxIterations,
        });
      }

      const llmStartTime = Date.now();
      
      // Emit LLM start callback
      if (callbackHandler?.handle) {
        await callbackHandler.handle({
          type: 'llm_start',
          timestamp: Date.now(),
          executionId,
          messages: messages.length,
          iteration: iterations,
        });
      }

      const response = await llm.invoke(messages);
      const content = String(response.content).trim();
      const llmDuration = Date.now() - llmStartTime;

      // Emit LLM end callback
      if (callbackHandler?.handle) {
        await callbackHandler.handle({
          type: 'llm_end',
          timestamp: Date.now(),
          executionId,
          response: content,
          duration: llmDuration,
        });
      }

      console.log(`  💬 Agent response: ${content.substring(0, 150)}...`);

      // Check if agent wants to use a tool
      if (content.includes('USE_TOOL:') && content.includes('PARAMETERS:')) {
        console.log(`  🛠️  Agent requesting tool...`);

        const toolMatch = content.match(/USE_TOOL:\s*(\w+)/i);
        const paramsMatch = content.match(/PARAMETERS:\s*(\{[^}]*\})/i);

        if (toolMatch && paramsMatch) {
          const toolName = toolMatch[1].toLowerCase();
          let params;
          
          try {
            params = JSON.parse(paramsMatch[1]);
          } catch (e) {
            console.error(`  ❌ Failed to parse parameters`);
            messages.push(new AIMessage(content));
            messages.push(new HumanMessage("Error: Invalid parameter format. Please provide valid JSON."));
            continue;
          }

          const tool = tools.find(t => t.name === toolName);
          
          if (!tool) {
            messages.push(new AIMessage(content));
            messages.push(new HumanMessage(`Error: Tool '${toolName}' not available.`));
            continue;
          }

          const toolStartTime = Date.now();
          
          // Emit tool start callback
          if (callbackHandler?.handle) {
            await callbackHandler.handle({
              type: 'tool_start',
              timestamp: Date.now(),
              executionId,
              toolName,
              parameters: params,
              iteration: iterations,
            });
          }

          try {
            const result = await tool.func(params);
            const toolDuration = Date.now() - toolStartTime;
            const parsedResult = JSON.parse(result);
            
            console.log(`  ✅ Tool result: ${result.substring(0, 100)}...`);

            toolCalls.push({
              toolName,
              parameters: params,
              result: parsedResult,
              timestamp: new Date().toISOString(),
            });

            reasoning.push(`Used ${toolName} with ${JSON.stringify(params)}`);

            // Emit tool end callback
            if (callbackHandler?.handle) {
              await callbackHandler.handle({
                type: 'tool_end',
                timestamp: Date.now(),
                executionId,
                toolName,
                result: parsedResult,
                duration: toolDuration,
                success: true,
              });

              await callbackHandler.handle({
                type: 'iteration_end',
                timestamp: Date.now(),
                executionId,
                iteration: iterations,
                action: 'tool_call',
              });
            }

            messages.push(new AIMessage(content));
            messages.push(new HumanMessage(`TOOL_RESULT: ${result}\n\nYou can now use another tool or give your final answer.`));

            continue;
          } catch (error: any) {
            const toolDuration = Date.now() - toolStartTime;
            console.error(`  ❌ Tool execution error:`, error);

            // Emit tool error callback
            if (callbackHandler?.handle) {
              await callbackHandler.handle({
                type: 'tool_end',
                timestamp: Date.now(),
                executionId,
                toolName,
                result: null,
                duration: toolDuration,
                success: false,
              });

              await callbackHandler.handle({
                type: 'error',
                timestamp: Date.now(),
                executionId,
                error: error.message,
                errorType: 'tool_error',
                context: { toolName, parameters: params },
              });
            }

            messages.push(new AIMessage(content));
            messages.push(new HumanMessage(`Tool execution error: ${error.message}`));
            continue;
          }
        }
      }

      // Check if agent is giving final answer
      if (content.includes('FINAL_ANSWER:')) {
        finalOutput = content.split('FINAL_ANSWER:')[1].trim();
        console.log(`  🎯 Final answer: ${finalOutput.substring(0, 100)}...`);
        
        if (callbackHandler?.handle) {
          await callbackHandler.handle({
            type: 'iteration_end',
            timestamp: Date.now(),
            executionId,
            iteration: iterations,
            action: 'final_answer',
          });
        }
        break;
      }

      if (iterations > 1 || !content.includes('USE_TOOL')) {
        finalOutput = content;
        console.log(`  🎯 Treating as final answer`);
        
        if (callbackHandler?.handle) {
          await callbackHandler.handle({
            type: 'iteration_end',
            timestamp: Date.now(),
            executionId,
            iteration: iterations,
            action: 'final_answer',
          });
        }
        break;
      }

      messages.push(new AIMessage(content));
      messages.push(new HumanMessage("Please use the exact format: USE_TOOL: tool_name and PARAMETERS: {...} or start with FINAL_ANSWER: if you're done."));
    }

    // Save conversation to memory
    await memory.saveContext(
      { input: prompt },
      { output: finalOutput }
    );

    console.log(`\n✅ Conversational agent completed after ${iterations} iterations`);
    console.log(`   💾 Saved to memory: ${conversationId}`);
    console.log(`   Tools used: ${toolCalls.length}`);
    console.log(`   Final output: ${finalOutput.substring(0, 100)}...`);

    const executionTime = Date.now() - startTime;
    const result = {
      success: true,
      output: finalOutput || "Agent completed but no output generated",
      reasoning,
      toolCalls,
      executionTime,
      conversationId,
    };

    // Emit completion callbacks
    if (callbackHandler?.handle) {
      await callbackHandler.handle({
        type: 'agent_end',
        timestamp: Date.now(),
        executionId,
        success: true,
        output: result.output,
        executionTime,
        toolCalls: toolCalls.length,
      });

      await callbackHandler.handle({
        type: 'complete',
        timestamp: Date.now(),
        executionId,
        success: true,
        output: result.output,
        totalExecutionTime: executionTime,
        totalIterations: iterations,
        totalToolCalls: toolCalls.length,
      });
    }

    return result;
  } catch (error: any) {
    console.error("❌ Conversational agent error:", error);
    
    // Emit error callback
    if (callbackHandler?.handle) {
      await callbackHandler.handle({
        type: 'error',
        timestamp: Date.now(),
        executionId,
        error: error.message,
        errorType: 'execution_error',
      });

      await callbackHandler.handle({
        type: 'agent_end',
        timestamp: Date.now(),
        executionId,
        success: false,
        executionTime: Date.now() - startTime,
        toolCalls: 0,
      });
    }

    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime,
      conversationId,
    };
  }
}

