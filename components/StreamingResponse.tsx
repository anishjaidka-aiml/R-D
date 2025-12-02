'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Wrench } from 'lucide-react';

interface StreamingResponseProps {
  conversationId: string | null;
  message: string;
  tools: string[];
  temperature?: number;
  onComplete: (data: {
    output: string;
    toolCalls?: any[];
    conversationId: string;
  }) => void;
  onError: (error: string) => void;
}

export default function StreamingResponse({
  conversationId,
  message,
  tools,
  temperature = 0.7,
  onComplete,
  onError,
}: StreamingResponseProps) {
  const [streamingContent, setStreamingContent] = useState('');
  const [status, setStatus] = useState<'starting' | 'streaming' | 'reasoning' | 'tool_call' | 'done'>('starting');
  const [toolCalls, setToolCalls] = useState<any[]>([]);
  const [currentTool, setCurrentTool] = useState<{ toolName: string; parameters: any } | null>(null);
  const [iteration, setIteration] = useState<{ current: number; max: number } | null>(null);
  const [finalConversationId, setFinalConversationId] = useState<string | null>(conversationId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when content updates
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [streamingContent]);

  useEffect(() => {
    // Start streaming
    const startStreaming = async () => {
      abortControllerRef.current = new AbortController();
      
      try {
        const response = await fetch('/api/conversation/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            conversationId,
            tools,
            temperature,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        let currentEvent = 'data';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.substring(6).trim();
              continue;
            }

            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.substring(5).trim());

                switch (currentEvent) {
                case 'conversationId':
                  setFinalConversationId(data.conversationId);
                  break;

                case 'status':
                  setStatus(data.status);
                  break;

                case 'token':
                  setStreamingContent(prev => prev + data.token);
                  setStatus('streaming');
                  break;

                case 'iteration':
                  setIteration({ current: data.iteration, max: data.maxIterations });
                  setStatus('reasoning');
                  break;

                case 'tool_start':
                  setCurrentTool({ toolName: data.toolName, parameters: data.parameters });
                  setStatus('tool_call');
                  break;

                case 'tool_result':
                  setToolCalls(prev => [...prev, {
                    toolName: data.toolName,
                    result: data.result,
                    timestamp: new Date().toISOString(),
                  }]);
                  setCurrentTool(null);
                  break;

                case 'tool_error':
                  setCurrentTool(null);
                  setStatus('streaming');
                  break;

                case 'done':
                  setStatus('done');
                  onComplete({
                    output: data.output,
                    toolCalls: data.toolCalls || toolCalls,
                    conversationId: data.conversationId || finalConversationId || '',
                  });
                  break;

                  case 'error':
                    onError(data.error);
                    break;
                }
              } catch (e) {
                // Skip invalid JSON
                console.warn('Failed to parse SSE data:', line);
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // Stream was aborted, ignore
          return;
        }
        console.error('Streaming error:', error);
        onError(error.message || 'Failed to stream response');
      }
    };

    startStreaming();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [message, conversationId, tools.join(','), temperature]); // Re-run if props change

  const getStatusText = () => {
    switch (status) {
      case 'starting':
        return 'Starting...';
      case 'reasoning':
        return iteration 
          ? `Reasoning (${iteration.current}/${iteration.max})...`
          : 'Reasoning...';
      case 'tool_call':
        return currentTool 
          ? `Using ${currentTool.toolName}...`
          : 'Using tool...';
      case 'streaming':
        return 'Streaming...';
      case 'done':
        return 'Done';
      default:
        return '';
    }
  };

  return (
    <div className="flex gap-3" ref={contentRef}>
      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <Bot className="w-5 h-5 text-white" />
      </div>
      
      <div className="max-w-[70%]">
        <div className="bg-white/10 text-white border border-white/20 rounded-2xl p-4">
          {/* Status indicator */}
          {status !== 'done' && (
            <div className="mb-2 text-xs text-white/70 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              {getStatusText()}
            </div>
          )}

          {/* Streaming content */}
          <p className="whitespace-pre-wrap">
            {streamingContent}
            {status !== 'done' && (
              <span className="inline-block w-2 h-4 bg-white/70 ml-1 animate-pulse" />
            )}
          </p>

          {/* Tool Calls */}
          {toolCalls.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="text-xs text-white/70 mb-2 flex items-center gap-1">
                <Wrench className="w-3 h-3" />
                Tools Used: {toolCalls.length}
              </div>
              {toolCalls.map((call, i) => (
                <div key={i} className="text-xs bg-black/20 rounded p-2 mb-1">
                  <span className="font-mono text-purple-300">{call.toolName}</span>
                  <span className="text-white/50 ml-2">
                    → {JSON.stringify(call.result).substring(0, 50)}...
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Current tool call */}
          {currentTool && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="text-xs text-white/70 mb-2 flex items-center gap-1">
                <Wrench className="w-3 h-3 animate-spin" />
                Executing: {currentTool.toolName}
              </div>
              <div className="text-xs bg-black/20 rounded p-2">
                <span className="font-mono text-purple-300">
                  {JSON.stringify(currentTool.parameters)}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="text-xs text-white/50 mt-1 px-2">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

