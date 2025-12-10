import { google } from "googleapis";
import { getGmailOAuthClient } from "@/lib/gmail/oauth-client";
import { upsertCredential } from "@/lib/ucs/credentials";
import { getCurrentUserId } from "@/lib/auth/current-user";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("Gmail OAuth error:", error);
      return new Response("Gmail authorization failed", { status: 400 });
    }

    if (!code) {
      return new Response("Missing code from Gmail", { status: 400 });
    }

    const userId = getCurrentUserId();

    // 1) OAuth client from DB config
    const { oauth2Client, config, redirectUri } = await getGmailOAuthClient();

    // 2) Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 3) Fetch user profile
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    // 4) Compute expiry
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    // 5) Store in UCS
    await upsertCredential({
      userId,
      provider: "gmail",
      providerUserId: profile.id || profile.email,
      username: profile.name || null,
      email: profile.email || null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      expiresAt,
      scopes: tokens.scope ? tokens.scope.split(" ") : config.scopes
    });

    // 6) Redirect back to UI
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectTo = "/email-assistant"; // change if needed
    return Response.redirect(new URL(redirectTo, appUrl));
  } catch (err) {
    console.error("Gmail callback error:", err);
    return new Response("Internal Gmail OAuth error", { status: 500 });
  }
}
