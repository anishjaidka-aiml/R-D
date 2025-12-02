/**
 * Email Tool
 * 
 * Allows agents to send emails using Resend API
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Email tool for sending emails
 */
export const emailTool = new DynamicStructuredTool({
  name: "send_email",
  description: "Send an email to a recipient. Use this when the user asks to send, email, or notify someone via email.",
  schema: z.object({
    to: z.string().email().describe("Email address of the recipient"),
    subject: z.string().describe("Subject line of the email"),
    body: z.string().describe("Body content of the email"),
  }),
  func: async ({ to, subject, body }) => {
    try {
      console.log(`📧 Email Tool Called:`);
      console.log(`  To: ${to}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Body: ${body.substring(0, 100)}...`);

      // TODO: Integrate with Resend when API key is added
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      
      if (!RESEND_API_KEY) {
        console.log("⚠️  RESEND_API_KEY not configured. Email simulation only.");
        return JSON.stringify({
          success: true,
          message: `Email would be sent to ${to}`,
          subject: subject,
          note: "RESEND_API_KEY not configured - this is a simulation",
        });
      }

      // Actual Resend integration
      const formatBodyAsHtml = (text: string) => {
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
      };

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev', // Replace with your verified domain
          to: [to],
          subject: subject,
          html: formatBodyAsHtml(body),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Email sent successfully!");
        return JSON.stringify({
          success: true,
          message: `Email sent successfully to ${to}`,
          messageId: data.id,
        });
      } else {
        throw new Error(data.message || 'Failed to send email');
      }
    } catch (error: any) {
      console.error("❌ Email tool error:", error);
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

