'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, History, Bot, User, Sparkles, Clock, Wrench, ArrowLeft, Zap } from 'lucide-react';
import Link from 'next/link';
import StreamingResponse from '@/components/StreamingResponse';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: any[];
  reasoning?: string[];
}

export default function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true); // Enable streaming by default
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableTools = [
    { id: 'calculator', name: 'Calculator', icon: '🧮' },
    { id: 'search_web', name: 'Web Search', icon: '🔍' },
    { id: 'http_request', name: 'HTTP Request', icon: '🌐' },
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessageId]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Use streaming if enabled
    if (useStreaming) {
      const streamingId = `streaming-${Date.now()}`;
      setCurrentStreamingMessage(currentInput);
      setStreamingMessageId(streamingId);
      return; // StreamingResponse component will handle the rest
    }

    // Non-streaming fallback
    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          conversationId,
          tools: selectedTools,
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Set conversation ID if new
        if (!conversationId && data.conversationId) {
          setConversationId(data.conversationId);
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.output,
          timestamp: new Date(),
          toolCalls: data.toolCalls,
          reasoning: data.reasoning,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Error message
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${data.error || 'Failed to get response'}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error: any) {
      console.error('Send error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleStreamingComplete = (data: {
    output: string;
    toolCalls?: any[];
    conversationId: string;
  }) => {
    const assistantMessage: Message = {
      role: 'assistant',
      content: data.output,
      timestamp: new Date(),
      toolCalls: data.toolCalls,
    };

    setMessages(prev => [...prev, assistantMessage]);
    
    // Update conversation ID if new
    if (!conversationId && data.conversationId) {
      setConversationId(data.conversationId);
    }
    
    setStreamingMessageId(null);
    setCurrentStreamingMessage('');
    setLoading(false);
  };

  const handleStreamingError = (error: string) => {
    const errorMessage: Message = {
      role: 'assistant',
      content: `Error: ${error}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, errorMessage]);
    setStreamingMessageId(null);
    setCurrentStreamingMessage('');
    setLoading(false);
  };

  const handleClearConversation = async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    if (!confirm('Clear this conversation? History will be lost.')) return;

    try {
      await fetch(`/api/conversation/${conversationId}`, {
        method: 'DELETE',
      });
      setMessages([]);
      setConversationId(null);
    } catch (error) {
      console.error('Clear error:', error);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-t-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Conversational Agent</h1>
                <p className="text-sm text-white/70">
                  {conversationId ? `Session: ${conversationId.slice(-8)}` : 'New Conversation'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleNewConversation}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                New Chat
              </button>
              <button
                onClick={handleClearConversation}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>

          {/* Tool Selection */}
          <div className="mt-4 flex gap-2 flex-wrap items-center">
            <span className="text-sm text-white/70 mr-2">Tools:</span>
            {availableTools.map(tool => (
              <button
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTools.includes(tool.id)
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {tool.icon} {tool.name}
              </button>
            ))}
            
            {/* Streaming Toggle */}
            <button
              onClick={() => setUseStreaming(!useStreaming)}
              className={`ml-4 px-3 py-1 rounded-full text-sm transition-colors flex items-center gap-1 ${
                useStreaming
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <Zap className="w-3 h-3" />
              {useStreaming ? 'Streaming ON' : 'Streaming OFF'}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white/5 backdrop-blur-lg border-x border-white/20 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Start a Conversation</h2>
                <p className="text-white/70 mb-4">
                  I'm an AI agent with memory. I'll remember our conversation!
                </p>
                <div className="text-sm text-white/50">
                  <p>Try asking:</p>
                  <p>"Calculate 25 * 17"</p>
                  <p>"What did I just ask you?"</p>
                  <p>"Double that result"</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[70%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                    <div
                      className={`rounded-2xl p-4 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                          : 'bg-white/10 text-white border border-white/20'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      
                      {/* Tool Calls */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/20">
                          <div className="text-xs text-white/70 mb-2 flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            Tools Used: {msg.toolCalls.length}
                          </div>
                          {msg.toolCalls.map((call, i) => (
                            <div key={i} className="text-xs bg-black/20 rounded p-2 mb-1">
                              <span className="font-mono text-purple-300">{call.toolName}</span>
                              <span className="text-white/50 ml-2">
                                → {JSON.stringify(call.result).substring(0, 50)}...
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-white/50 mt-1 px-2">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Streaming Response */}
              {streamingMessageId && loading && useStreaming && currentStreamingMessage && (
                <StreamingResponse
                  conversationId={conversationId}
                  message={currentStreamingMessage}
                  tools={selectedTools}
                  temperature={0.7}
                  onComplete={handleStreamingComplete}
                  onError={handleStreamingError}
                />
              )}
              
              {/* Non-streaming loading indicator */}
              {loading && !useStreaming && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white/10 backdrop-blur-lg rounded-b-2xl border border-white/20 p-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type your message... (Press Enter to send)"
              className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

