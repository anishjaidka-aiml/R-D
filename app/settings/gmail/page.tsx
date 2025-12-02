/**
 * Gmail Settings Page
 * 
 * Central place to manage Gmail connections
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Info } from 'lucide-react';
import GmailStatus from '@/components/GmailStatus';

export default function GmailSettingsPage() {
  const [userId, setUserId] = useState<string>('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-primary rounded-xl">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Gmail Settings</h1>
                <p className="text-muted-foreground">
                  Manage your Gmail connection for workflow automation
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-lg border border-border p-6 space-y-6">
            {/* Gmail Status */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
              <GmailStatus 
                userId={userId || undefined}
                showActions={true}
                onStatusChange={(status) => {
                  if (status.email) {
                    setUserId(status.email);
                  }
                }}
              />
            </div>

            {/* Check Specific Account */}
            <div className="pt-6 border-t border-border">
              <h2 className="text-lg font-semibold mb-4">Check Specific Account</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter an email address to check its Gmail connection status
                  </p>
                </div>
                {userId && (
                  <div className="mt-4">
                    <GmailStatus userId={userId} showActions={true} />
                  </div>
                )}
              </div>
            </div>

            {/* Information Section */}
            <div className="pt-6 border-t border-border">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-2 text-blue-900">
                      About Gmail Integration
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Gmail allows you to send emails directly from your Gmail account</li>
                      <li>• OAuth tokens are encrypted and stored securely</li>
                      <li>• Tokens automatically refresh when they expire</li>
                      <li>• You can disconnect at any time to revoke access</li>
                      <li>• Gmail tool is available in workflows once connected</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="pt-6 border-t border-border">
              <h2 className="text-lg font-semibold mb-4">Troubleshooting</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <h3 className="font-medium mb-1">Token Expired</h3>
                  <p className="text-muted-foreground">
                    If your token expires, click "Reconnect Gmail" to get a fresh token.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Permission Errors</h3>
                  <p className="text-muted-foreground">
                    If you see "Insufficient Permission" errors, make sure:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-1 ml-4">
                    <li>Gmail API is enabled in Google Cloud Console</li>
                    <li>You granted all permissions during OAuth</li>
                    <li>You re-authenticated after enabling Gmail API</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Need Help?</h3>
                  <p className="text-muted-foreground">
                    Check the troubleshooting guide in{' '}
                    <Link href="/docs/TROUBLESHOOTING-GMAIL-PERMISSIONS.md" className="text-primary hover:underline">
                      docs/TROUBLESHOOTING-GMAIL-PERMISSIONS.md
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


