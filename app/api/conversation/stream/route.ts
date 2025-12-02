/**
 * Streaming Conversation API
 * 
 * Handles streaming conversational agent requests with Server-Sent Events (SSE)
 * 
 * POST /api/conversation/stream - Stream message in conversation
 */

import { NextRequest } from "next/server";
import { createAIMLClient } from "@/lib/langchain/client";
import { getTools } from "@/lib/langchain/tools";
import { getConversationMemory } from "@/lib/langchain/memory-manager";
import { 
  generateConversationId, 
} from "@/lib/langchain/memory-manager";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

/**
 * POST - Stream message in a conversation
 * Uses Server-Sent Events (SSE) to stream tokens in real-time
 */
export async function POST(request: NextRequest) {
  // Create a ReadableStream for SSE
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      const sendError = (error: string) => {
        sendEvent('error', { error });
        controller.close();
      };

      try {
        const body = await request.json();
        const { 
          message, 
          conversationId, 
          tools = [],
          temperature = 0.1,
          model,
          systemPrompt 
        } = body;

        if (!message || typeof message !== 'string') {
          sendError('Message is required');
          return;
        }

        // Generate conversation ID if not provided
        const convId = conversationId || generateConversationId();
        
        sendEvent('conversationId', { conversationId: convId });
        sendEvent('status', { status: 'starting' });

        console.log(`\n🗨️ Streaming Conversation API - POST`);
        console.log(`   Conversation ID: ${convId}`);
        console.log(`   Message: ${message.substring(0, 100)}...`);
        console.log(`   Tools: ${tools.join(', ') || 'none'}`);

        const llm = createAIMLClient({
          temperature: temperature || 0.1,
          maxTokens: 2000,
          modelName: model,
        });

        const toolList = tools && tools.length > 0 ? getTools(tools) : [];

        // Get memory for this conversation
        const memory = getConversationMemory(convId, {
          type: "buffer_window",
          windowSize: 10,
          returnMessages: true,
        });

        // Load chat history
        const memoryVariables = await memory.loadMemoryVariables({});
        const chatHistory: BaseMessage[] = memoryVariables.chat_history || [];
        
        console.log(`   💾 Loaded ${chatHistory.length} previous messages from memory`);

        // Build tool descriptions if tools are available
        let toolSection = '';
        if (toolList.length > 0) {
          const toolDescriptions = toolList.map(tool => {
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
        const systemPromptText = `${systemPrompt || 'You are a helpful AI assistant with memory. You remember the conversation history and can reference previous messages.'}
${toolSection}

Remember: You can refer to previous messages in this conversation. The user expects you to remember context.`;

        // Build message history
        const messages: BaseMessage[] = [
          new SystemMessage(systemPromptText),
          ...chatHistory,
          new HumanMessage(message),
        ];

        // If no tools, stream directly
        if (toolList.length === 0) {
          sendEvent('status', { status: 'streaming' });
          
          let fullResponse = '';
          
          // Stream the response
          const streamResponse = await llm.stream(messages);
          
          for await (const chunk of streamResponse) {
            const content = chunk.content as string;
            if (content) {
              fullResponse += content;
              sendEvent('token', { token: content });
            }
          }

          // Save to memory
          await memory.saveContext(
            { input: message },
            { output: fullResponse }
          );

          sendEvent('done', { 
            output: fullResponse,
            conversationId: convId 
          });
          controller.close();
          return;
        }

        // With tools - handle tool calling loop
        sendEvent('status', { status: 'reasoning' });
        
        let iterations = 0;
        const maxIterations = 10;
        const toolCalls: any[] = [];
        let finalOutput = '';
        let accumulatedResponse = '';

        while (iterations < maxIterations) {
          iterations++;
          console.log(`\n  📍 Iteration ${iterations}/${maxIterations}`);

          sendEvent('iteration', { iteration: iterations, maxIterations });

          // Stream the response
          const streamResponse = await llm.stream(messages);
          let iterationResponse = '';

          for await (const chunk of streamResponse) {
            const content = chunk.content as string;
            if (content) {
              iterationResponse += content;
              accumulatedResponse += content;
              sendEvent('token', { token: content });
            }
          }

          const content = iterationResponse.trim();
          console.log(`  💬 Agent response: ${content.substring(0, 150)}...`);

          // Check if agent wants to use a tool
          if (content.includes('USE_TOOL:') && content.includes('PARAMETERS:')) {
            sendEvent('status', { status: 'tool_call' });
            console.log(`  🛠️  Agent requesting tool...`);

            const toolMatch = content.match(/USE_TOOL:\s*(\w+)/i);
            const paramsMatch = content.match(/PARAMETERS:\s*(\{[^}]*\})/i);

            if (toolMatch && paramsMatch) {
              const toolName = toolMatch[1].toLowerCase();
              let params;
              
              try {
                params = JSON.parse(paramsMatch[1]);
              } catch (e) {
                sendEvent('error', { error: 'Invalid parameter format' });
                messages.push(new AIMessage(content));
                messages.push(new HumanMessage("Error: Invalid parameter format. Please provide valid JSON."));
                continue;
              }

              const tool = toolList.find(t => t.name === toolName);
              
              if (!tool) {
                sendEvent('error', { error: `Tool '${toolName}' not available` });
                messages.push(new AIMessage(content));
                messages.push(new HumanMessage(`Error: Tool '${toolName}' not available.`));
                continue;
              }

              try {
                sendEvent('tool_start', { toolName, parameters: params });
                
                const result = await tool.func(params);
                console.log(`  ✅ Tool result: ${result.substring(0, 100)}...`);

                toolCalls.push({
                  toolName,
                  parameters: params,
                  result: JSON.parse(result),
                  timestamp: new Date().toISOString(),
                });

                sendEvent('tool_result', { 
                  toolName, 
                  result: JSON.parse(result) 
                });

                messages.push(new AIMessage(content));
                messages.push(new HumanMessage(`TOOL_RESULT: ${result}\n\nYou can now use another tool or give your final answer.`));

                continue;
              } catch (error: any) {
                console.error(`  ❌ Tool execution error:`, error);
                sendEvent('tool_error', { 
                  toolName, 
                  error: error.message 
                });
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
            break;
          }

          // If no tool call and no final answer marker, treat as final answer
          if (iterations > 1 || !content.includes('USE_TOOL')) {
            finalOutput = content;
            console.log(`  🎯 Treating as final answer`);
            break;
          }

          messages.push(new AIMessage(content));
          messages.push(new HumanMessage("Please use the exact format: USE_TOOL: tool_name and PARAMETERS: {...} or start with FINAL_ANSWER: if you're done."));
        }

        // Save conversation to memory
        await memory.saveContext(
          { input: message },
          { output: finalOutput || accumulatedResponse }
        );

        sendEvent('done', {
          output: finalOutput || accumulatedResponse,
          toolCalls,
          conversationId: convId,
          iterations,
        });

        console.log(`\n✅ Streaming conversation completed`);
        controller.close();

      } catch (error: any) {
        console.error('❌ Streaming conversation error:', error);
        sendError(error.message || 'Failed to process conversation');
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

