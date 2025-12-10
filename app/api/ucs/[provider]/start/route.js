// app/api/ucs/[provider]/start/route.js
import { connectors } from "../../../../../lib/connectors";

export async function GET(req, { params }) {
  try {
    const { provider } = params;

    if (!provider || !connectors[provider]) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Unknown provider in start route",
          provider,
          available: Object.keys(connectors),
        }),
        { status: 400 }
      );
    }

    const BASE_URL = process.env.APP_URL || "http://localhost:3000";
    const redirectUri = `${BASE_URL}/api/ucs/${provider}/callback`;

    let authorizeUrl;

    if (provider === "slack") {
      // 🔹 Slack OAuth
      const botScopes = ["chat:write"].join(",");
      const userScopes = [
        "users:read",
        "users:read.email",
        "users.profile:read",
      ].join(",");

      authorizeUrl =
        "https://slack.com/oauth/v2/authorize" +
        `?client_id=${encodeURIComponent(process.env.SLACK_CLIENT_ID)}` +
        `&scope=${encodeURIComponent(botScopes)}` +
        `&user_scope=${encodeURIComponent(userScopes)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    } else if (provider === "discord") {
      // 🔹 Discord OAuth
      const scopes = ["identify", "email"].join(" "); // space-separated for Discord

      authorizeUrl =
        "https://discord.com/oauth2/authorize" +
        `?client_id=${encodeURIComponent(process.env.DISCORD_CLIENT_ID)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&prompt=consent`;
    } else if (provider === "gmail") {
      // 🔹 Gmail / Google OAuth
      const scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        // for later sending emails from workflows:
        "https://www.googleapis.com/auth/gmail.send",
      ].join(" ");

      authorizeUrl =
        "https://accounts.google.com/o/oauth2/v2/auth" +
        `?client_id=${encodeURIComponent(process.env.GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&access_type=offline` + // get refresh_token
        `&prompt=consent` + // always show consent, ensures refresh_token
        `&scope=${encodeURIComponent(scopes)}`;
    } else {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Provider not implemented in start route",
          provider,
        }),
        { status: 400 }
      );
    }

    return new Response(null, {
      status: 302,
      headers: { Location: authorizeUrl },
    });
  } catch (err) {
    console.error("UCS START ERROR:", err);
    return new Response(
      JSON.stringify({
        ok: false,
        stage: "start",
        error: err.message || String(err),
      }),
      { status: 500 }
    );
  }
}
