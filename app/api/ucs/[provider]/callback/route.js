// app/api/ucs/[provider]/callback/route.js
import { connectors } from "../../../../../lib/connectors";
import { encrypt } from "../../../../../lib/auth/crypto";
import { query } from "../../../../../lib/db";
import jwt from "jsonwebtoken";


export async function GET(req, { params }) {
  try {
    const { provider } = params || {};

    const connector = connectors[provider];
    if (!connector) {
      return new Response("Unknown provider", { status: 400 });
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // TODO: validate state later

    if (!code) {
      return new Response("Missing code", { status: 400 });
    }

    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/ucs/${provider}/callback`;

    // 1) Exchange code for tokens from Slack
    const tokenRes = await connector.exchangeCode(code, redirectUri);

    const accessToken =
      tokenRes.access_token ||
      (tokenRes.authed_user && tokenRes.authed_user.access_token);
    const refreshToken = tokenRes.refresh_token || null;

    if (!accessToken) {
      console.error("Token response from provider:", tokenRes);
      return new Response("No access token from provider", { status: 500 });
    }

    // 2) Fetch Slack profile
    const profile = await connector.getProfile(accessToken);
    const providerUserId = profile.id;
    const email = profile.email || null;
    const displayName = profile.display_name || profile.username || null;

    // 3) Find or create local user + external account
    let ea = await query(
      "SELECT * FROM external_accounts WHERE provider=$1 AND provider_user_id=$2",
      [provider, providerUserId]
    );

    let userId;

    if (ea.rowCount) {
      // already linked
      userId = ea.rows[0].user_id;
    } else if (email) {
      // match by email if user already exists
      const ur = await query("SELECT id FROM users WHERE email=$1", [email]);
      if (ur.rowCount) {
        userId = ur.rows[0].id;
      }
    }

    // If user doesn't exist, create one
    if (!userId) {
      const cr = await query(
        "INSERT INTO users (email, display_name) VALUES ($1,$2) RETURNING id",
        [email, displayName]
      );
      userId = cr.rows[0].id;
    }

    // If external account record doesn't exist, create it
    if (!ea.rowCount) {
      await query(
        `INSERT INTO external_accounts
         (user_id, provider, provider_user_id, username, email, raw_profile)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [userId, provider, providerUserId, profile.username, email, profile.raw]
      );

      ea = await query(
        "SELECT * FROM external_accounts WHERE provider=$1 AND provider_user_id=$2",
        [provider, providerUserId]
      );
    }

    const externalAccount = ea.rows[0];

    // 4) Store provider tokens (encrypted)
    await query(
      `INSERT INTO provider_tokens
       (external_account_id, access_token, refresh_token, scope, expires_at, token_type)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        externalAccount.id,
        encrypt(accessToken),
        refreshToken ? encrypt(refreshToken) : null,
        tokenRes.scope || "",
        tokenRes.expires_in
          ? new Date(Date.now() + tokenRes.expires_in * 1000)
          : null,
        tokenRes.token_type || "",
      ]
    );

    // 5) Issue app JWT and set cookie
    const payload = { sub: userId, providers: [provider] };
    const secret = process.env.APP_JWT_SECRET || "dev_secret";
    const expiresSec = Number(process.env.APP_JWT_EXPIRES || 900);

    const token = jwt.sign(payload, secret, {
      expiresIn: `${expiresSec}s`,
    });

    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `app_token=${token}; HttpOnly; Path=/; Max-Age=${expiresSec}; SameSite=Lax`
    );
    headers.append("Location", baseUrl);

    // Redirect back to app root
    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error("UCS callback fatal error:", err);

    // For now return JSON so we can see the exact problem if anything breaks
    return new Response(
      JSON.stringify({
        ok: false,
        error: err?.message || String(err),
        stack: err?.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
