/**
 * Gmail Status Component
 * 
 * Reusable component to display Gmail connection status
 */

'use client';

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface GmailStatusData {
  connected: boolean;
  valid: boolean;
  needsReauthentication: boolean;
  email: string | null;
  expiresAt: number | null;
}

interface GmailStatusProps {
  userId?: string;
  showActions?: boolean;
  compact?: boolean;
  onStatusChange?: (status: GmailStatusData) => void;
}

export default function GmailStatus({ 
  userId, 
  showActions = true, 
  compact = false,
  onStatusChange 
}: GmailStatusProps) {
  const [status, setStatus] = useState<GmailStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      setError(null);
      const targetUserId = userId || 'default';
      const response = await fetch(`/api/auth/gmail/status?userId=${encodeURIComponent(targetUserId)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Gmail status');
      }

      const data = await response.json();
      setStatus(data);
      if (onStatusChange) {
        onStatusChange(data);
      }
    } catch (err: any) {
      setError(err.message);
      setStatus(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [userId]);

  const handleConnect = () => {
    window.location.href = '/api/auth/gmail';
  };

  const handleDisconnect = async () => {
    if (!status?.email) return;
    
    if (!confirm(`Are you sure you want to disconnect Gmail for ${status.email}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/gmail/disconnect?userId=${encodeURIComponent(status.email)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchStatus();
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (err: any) {
      alert(`Failed to disconnect: ${err.message}`);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking Gmail status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <XCircle className="w-4 h-4" />
        <span className="text-sm">Error: {error}</span>
        {showActions && (
          <button
            onClick={handleRefresh}
            className="text-xs underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const isConnected = status.connected && status.valid && !status.needsReauthentication;
  const isExpired = status.connected && status.needsReauthentication;
  const isNotConnected = !status.connected;

  // Compact mode (for tooltips, badges, etc.)
  if (compact) {
    if (isConnected) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="w-3 h-3" />
          <span className="text-xs">Gmail Connected</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <XCircle className="w-3 h-3" />
        <span className="text-xs">Gmail Not Connected</span>
      </div>
    );
  }

  // Full mode
  return (
    <div className="space-y-3">
      {/* Status Display */}
      <div className={`p-4 rounded-lg border ${
        isConnected 
          ? 'bg-green-50 border-green-200' 
          : isExpired
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {isConnected ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : isExpired ? (
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-400 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4" />
                <h3 className="font-semibold text-sm">
                  Gmail Connection
                </h3>
              </div>
              
              {isConnected && status.email && (
                <>
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Email:</span> {status.email}
                  </p>
                  {status.expiresAt && (
                    <p className="text-xs text-gray-600">
                      Token expires: {new Date(status.expiresAt).toLocaleString()}
                    </p>
                  )}
                </>
              )}

              {isExpired && status.email && (
                <p className="text-sm text-yellow-800 mb-1">
                  Token expired. Please reconnect.
                </p>
              )}

              {isNotConnected && (
                <p className="text-sm text-gray-600">
                  Gmail is not connected. Connect to enable Gmail tool in workflows.
                </p>
              )}
            </div>
          </div>

          {showActions && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1 hover:bg-white/50 rounded transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2">
          {isNotConnected && (
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Connect Gmail
            </button>
          )}

          {isExpired && (
            <>
              <button
                onClick={handleConnect}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Reconnect Gmail
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Disconnect
              </button>
            </>
          )}

          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Disconnect
            </button>
          )}

          <Link
            href="/settings/gmail"
            className="px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Manage Settings
          </Link>
        </div>
      )}
    </div>
  );
}


