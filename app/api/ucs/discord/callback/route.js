// app/api/ucs/discord/callback/route.js

import { discordConnector } from "@/lib/connectors/discord";
import { upsertCredential } from "@/lib/ucs/credentials";
import { getCurrentUserId } from "@/lib/auth/current-user";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("Discord OAuth error param:", error);
      return new Response("Discord authorization failed", { status: 400 });
    }

    if (!code) {
      return new Response("Missing code from Discord", { status: 400 });
    }

    const userId = getCurrentUserId(); // uses your JWT/cookie logic
    if (!userId) {
      return new Response("Not authenticated", { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${appUrl}/api/ucs/discord/callback`;

    // 1) Exchange code for tokens
    const tokenData = await discordConnector.exchangeCode(code, redirectUri);
    // tokenData: { access_token, token_type, expires_in, refresh_token, scope }

    if (!tokenData || !tokenData.access_token) {
      console.error("Discord tokenData missing access_token:", tokenData);
      return new Response(
        JSON.stringify({
          error: "Discord token exchange failed",
          details: tokenData,
        }),
        { status: 500 }
      );
    }

    // 2) Fetch user profile
    const profile = await discordConnector.getProfile(tokenData.access_token);

    // 3) Compute expiry time
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    // 4) Store in UCS
    await upsertCredential({
      userId,
      provider: "discord",
      providerUserId: profile.id,
      username: profile.username,
      email: profile.email,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresAt,
      scopes: tokenData.scope ? tokenData.scope.split(" ") : null,
    });

    // 5) Redirect back to UI
    const redirectTo = "/email-assistant"; // or wherever you want
    return Response.redirect(new URL(redirectTo, appUrl));
  } catch (err) {
    // ⬇️ log everything so we can see the REAL cause
    console.error(
      "Discord callback error:",
      err?.response?.data || err.message || err
    );

    return new Response(
      JSON.stringify({
        error: "Discord OAuth failed",
        details: err?.response?.data || err.message || String(err),
      }),
      { status: 500 }
    );
  }
}
