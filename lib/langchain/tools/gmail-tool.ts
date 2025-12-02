/**
 * Gmail Tool
 * 
 * Allows agents to send emails using Gmail API
 * Requires OAuth authentication (user must connect Gmail first)
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { google } from "googleapis";
import { getValidAccessToken } from "@/lib/gmail/token-refresh";
import { getOAuth2Client } from "@/lib/gmail/oauth-client";

/**
 * Format plain text body as HTML for Gmail
 */
function formatBodyAsHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .split('\n\n')
    .map(
      (paragraph) =>
        `<p style="margin:0 0 12px 0; line-height:1.5;">${paragraph
          .split('\n')
          .join('<br />')}</p>`
    )
    .join('');
}

/**
 * Create RFC 2822 email message
 */
function createEmailMessage(
  from: string,
  to: string,
  subject: string,
  htmlBody: string
): string {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    htmlBody,
  ].join('\n');

  // Encode to base64url format (Gmail API requirement)
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Gmail tool for sending emails via Gmail API
 */
export const gmailTool = new DynamicStructuredTool({
  name: "send_gmail",
  description: "Send an email using Gmail. The user must have connected their Gmail account first via OAuth. Use this when the user asks to send an email via Gmail.",
  schema: z.object({
    to: z.string().email().describe("Email address of the recipient"),
    subject: z.string().describe("Subject line of the email"),
    body: z.string().describe("Body content of the email"),
    userId: z.string().email().optional().describe("Gmail account email to send from (optional, uses first connected account if not specified)"),
  }),
  func: async ({ to, subject, body, userId }) => {
    try {
      console.log(`📧 Gmail Tool Called:`);
      console.log(`  To: ${to}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Body: ${body.substring(0, 100)}...`);
      console.log(`  From User: ${userId || 'auto-detect'}`);

      // Get user ID - use provided or get first available
      let targetUserId = userId;
      
      if (!targetUserId) {
        // Try to get the first connected Gmail account
        const { getAllUserIds } = await import('@/lib/gmail/token-storage');
        const userIds = await getAllUserIds();
        
        if (userIds.length === 0) {
          return JSON.stringify({
            success: false,
            error: 'No Gmail account connected',
            message: 'Gmail connection required. Please connect your Gmail account first by visiting /api/auth/gmail or specify userId parameter.',
          });
        }
        
        // Use first connected account
        targetUserId = userIds[0];
        console.log(`  Using first connected account: ${targetUserId}`);
      }

      // Get valid access token (auto-refreshes if expired)
      const accessToken = await getValidAccessToken(targetUserId);
      
      if (!accessToken) {
        return JSON.stringify({
          success: false,
          error: 'Gmail authentication failed or expired',
          message: `Gmail account ${targetUserId} needs to be re-authenticated. Please visit /api/auth/gmail to reconnect.`,
        });
      }

      // Create Gmail API client
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials({
        access_token: accessToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Use the userId as the from email (we already have it from OAuth)
      // No need to call getProfile which requires additional scopes
      const fromEmail = targetUserId;
      
      if (!fromEmail) {
        throw new Error('Failed to get Gmail address');
      }

      console.log(`  Sending from: ${fromEmail}`);

      // Format email body as HTML
      const htmlBody = formatBodyAsHtml(body);

      // Create email message (RFC 2822 format)
      const rawMessage = createEmailMessage(fromEmail, to, subject, htmlBody);

      // Send email via Gmail API
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: rawMessage,
        },
      });

      const messageId = response.data.id;

      if (messageId) {
        console.log(`✅ Gmail sent successfully! Message ID: ${messageId}`);
        return JSON.stringify({
          success: true,
          message: `Email sent successfully to ${to} via Gmail`,
          messageId: messageId,
          from: fromEmail,
        });
      } else {
        throw new Error('Gmail API did not return message ID');
      }
    } catch (error: any) {
      console.error("❌ Gmail tool error:", error);
      
      // Provide helpful error messages based on error type
      let errorMessage = error.message || 'Unknown error';
      let detailedMessage = errorMessage;
      
      // Check for specific Gmail API errors
      if (error.code === 403) {
        if (errorMessage.includes('insufficient') || errorMessage.includes('permission') || errorMessage.includes('Insufficient Permission')) {
          errorMessage = 'Insufficient Permission';
          detailedMessage = 'Gmail API permission denied. This usually means:\n1. Gmail API is not enabled in Google Cloud Console\n2. OAuth scopes were not properly granted\n3. Token needs to be refreshed with correct permissions\n\nPlease:\n1. Enable Gmail API in Google Cloud Console (https://console.cloud.google.com/apis/library/gmail.googleapis.com)\n2. Re-authenticate by visiting /api/auth/gmail to get fresh tokens with proper scopes';
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
          errorMessage = 'Gmail quota exceeded';
          detailedMessage = 'Gmail sending quota exceeded. Please try again later.';
        } else {
          errorMessage = 'Gmail API access denied';
          detailedMessage = 'Access to Gmail API was denied. Please check:\n1. Gmail API is enabled in Google Cloud Console\n2. OAuth consent screen is properly configured\n3. Your account has permission to use Gmail API';
        }
      } else if (error.code === 401 || errorMessage.includes('authentication') || errorMessage.includes('credential')) {
        errorMessage = 'Gmail authentication failed';
        detailedMessage = 'Gmail authentication failed or token expired. Please reconnect your Gmail account by visiting /api/auth/gmail';
      } else if (error.code === 404) {
        errorMessage = 'Gmail API not found';
        detailedMessage = 'Gmail API endpoint not found. Please ensure Gmail API is enabled in Google Cloud Console.';
      }

      return JSON.stringify({
        success: false,
        error: errorMessage,
        message: `Failed to send email via Gmail: ${detailedMessage}`,
        code: error.code,
        details: error.response?.data || error.message,
      });
    }
  },
});

