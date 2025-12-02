'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mail, User, Bot, Sparkles, Trash2, Copy, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import GmailStatus from '@/components/GmailStatus';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: any[];
  isEmailDraft?: boolean;
}

export default function EmailAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `👋 Hi! I'm your Email Assistant with memory!\n\nI can help you:\n• Draft professional emails\n• Send emails via Resend\n• Remember context across multiple messages\n• Refine drafts based on your feedback\n\nTry saying:\n"I need to write an email to my team about the project update"`,
        timestamp: new Date(),
      }]);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationId,
          tools: ['send_email'], // Only email tool
          temperature: 0.7,
          systemPrompt: `You are a professional email assistant with memory. You help users draft and send emails.

IMPORTANT GUIDELINES:
1. Remember all details from previous messages in this conversation
2. When drafting emails, use a professional tone
3. Ask clarifying questions if needed (recipient, subject, etc.)
4. Before sending, always confirm with user
5. Use the send_email tool when user confirms

Format email drafts clearly with:
Subject: [subject]
To: [recipient]
Body: [content]

Remember: You can reference ANY previous message in this conversation!`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (!conversationId && data.conversationId) {
          setConversationId(data.conversationId);
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.output,
          timestamp: new Date(),
          toolCalls: data.toolCalls,
          isEmailDraft: data.output.includes('Subject:') && data.output.includes('To:'),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
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

  const handleClearConversation = async () => {
    if (!confirm('Start a new email conversation? Current context will be lost.')) return;

    if (conversationId) {
      try {
        await fetch(`/api/conversation/${conversationId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Clear error:', error);
      }
    }
    
    setMessages([]);
    setConversationId(null);
    // Re-trigger welcome message
    setTimeout(() => {
      setMessages([{
        role: 'assistant',
        content: `👋 Hi! I'm your Email Assistant with memory!\n\nI can help you:\n• Draft professional emails\n• Send emails via Resend\n• Remember context across multiple messages\n• Refine drafts based on your feedback\n\nTry saying:\n"I need to write an email to my team about the project update"`,
        timestamp: new Date(),
      }]);
    }, 100);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const quickPrompts = [
    "Draft an email to my team about the project update",
    "Write a follow-up email to the client",
    "Create a meeting invitation email",
    "Help me write a thank you email",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900">
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  📧 Email Assistant
                  <span className="text-sm bg-purple-500/30 px-2 py-1 rounded-full">with Memory</span>
                </h1>
                <p className="text-sm text-white/70">
                  {conversationId 
                    ? `Active conversation • ${messages.length} messages` 
                    : 'Start a new conversation'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClearConversation}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              New Conversation
            </button>
          </div>

          {/* Info Banner */}
          <div className="mt-4 space-y-3">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
              <p className="text-sm text-white/90">
                💡 <strong>Memory-Powered:</strong> I remember everything you tell me in this conversation! 
                You can reference previous details, refine drafts, and I'll keep track of all context.
              </p>
            </div>
            
            {/* Gmail Status */}
            <div className="bg-white/10 border border-white/20 rounded-lg p-3">
              <div className="text-white/90 text-sm mb-2 font-medium">Gmail Connection:</div>
              <div className="text-white">
                <GmailStatus showActions={false} compact={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white/5 backdrop-blur-lg border-x border-white/20 overflow-y-auto p-6">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[70%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-2xl p-4 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                        : msg.isEmailDraft
                        ? 'bg-gradient-to-br from-green-500/20 to-blue-500/20 text-white border-2 border-green-500/50'
                        : 'bg-white/10 text-white border border-white/20'
                    }`}
                  >
                    {msg.isEmailDraft && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
                        <Sparkles className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-semibold text-green-400">EMAIL DRAFT</span>
                      </div>
                    )}
                    
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Tool Calls - Email Sent */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/20">
                        {msg.toolCalls.map((call, i) => (
                          <div key={i} className="bg-green-500/20 rounded-lg p-3 border border-green-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Check className="w-4 h-4 text-green-400" />
                              <span className="text-sm font-semibold text-green-400">Email Sent!</span>
                            </div>
                            <div className="text-xs text-white/80 space-y-1">
                              <div><strong>To:</strong> {call.parameters?.to || 'N/A'}</div>
                              <div><strong>Subject:</strong> {call.parameters?.subject || 'N/A'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {msg.isEmailDraft && (
                      <button
                        onClick={() => copyToClipboard(msg.content, idx)}
                        className="mt-2 flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy Draft
                          </>
                        )}
                      </button>
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
            
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white animate-pulse" />
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
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="bg-white/5 backdrop-blur-lg border-x border-white/20 px-6 py-3">
            <p className="text-xs text-white/70 mb-2">Quick starts:</p>
            <div className="flex gap-2 flex-wrap">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(prompt)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white/10 backdrop-blur-lg rounded-b-2xl border border-white/20 p-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Tell me about the email you need to send..."
              className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all flex items-center gap-2"
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

