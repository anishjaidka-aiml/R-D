'use client';

import Link from 'next/link';
import { Workflow } from 'lucide-react';
import GmailStatus from '@/components/GmailStatus';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Logo & Title */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-primary rounded-2xl shadow-xl">
                <Workflow className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Neevcloud Agent
            </h1>
          </div>

          {/* Gmail Status */}
          <div className="max-w-2xl mx-auto">
            <GmailStatus showActions={true} />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mt-12">
            <Link
              href="/email-assistant"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              📧 Email Assistant
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">NEW</span>
            </Link>
            <Link
              href="/conversation"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg hover:shadow-xl"
            >
              💬 Chat with Agent
            </Link>
            <Link
              href="/templates"
              className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
            >
              Browse Templates
            </Link>
            <Link
              href="/workflows"
              className="px-8 py-4 bg-white text-primary border-2 border-primary rounded-lg font-semibold hover:bg-purple-50 transition-colors"
            >
              My Workflows
            </Link>
            <Link
              href="/rag"
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-teal-600 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              📚 Document RAG
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">NEW</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
