// app/api/auth/gmail/callback/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { encrypt } from "@/lib/auth/crypto";
import { query } from "@/lib/db";

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

type GoogleUserInfo = {
  id?: string;
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: any;
};

export async function GET(req: NextRequest) {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("Gmail OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}?gmail=error`);
  }

  if (!code) {
    return NextResponse.json(
      { ok: false, error: "NO_CODE" },
      { status: 400 }
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    `${baseUrl}/api/auth/gmail/callback`;

  if (!clientId || !clientSecret) {
    console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return NextResponse.json(
      {
        ok: false,
        error: "MISSING_ENV",
        message: "GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set",
      },
      { status: 500 }
    );
  }

  // 1) Exchange code → tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenJson = (await tokenRes.json()) as GoogleTokenResponse;

  if (!tokenRes.ok || !tokenJson.access_token) {
    console.error("Gmail token exchange failed:", tokenJson);
    return NextResponse.json(
      { ok: false, error: "TOKEN_EXCHANGE_FAILED", details: tokenJson },
      { status: 500 }
    );
  }

  const accessToken = tokenJson.access_token;
  const refreshToken = tokenJson.refresh_token ?? null;

  // 2) Fetch Gmail user info
  let profile: GoogleUserInfo = {};
  try {
    const meRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    profile = (await meRes.json()) as GoogleUserInfo;
    if (!meRes.ok) {
      console.error("Gmail userinfo error:", profile);
    }
  } catch (e) {
    console.error("Error fetching Gmail userinfo:", e);
  }

  const providerUserId = profile.id ?? profile.sub ?? "";
  const email = profile.email ?? null;
  const displayName = profile.name ?? profile.email ?? null;

  if (!providerUserId || !email) {
    console.error("Gmail profile missing id or email:", profile);
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_PROFILE",
        profile,
      },
      { status: 500 }
    );
  }

  // 3) Find or create user in UCS 'users' table
  let userId: number;

  const userRes = await query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (userRes.rowCount) {
    userId = userRes.rows[0].id;
  } else {
    const insertUser = await query(
      "INSERT INTO users (email, display_name) VALUES ($1, $2) RETURNING id",
      [email, displayName]
    );
    userId = insertUser.rows[0].id;
  }

  // 4) Upsert external_accounts row for Gmail
  const existingAcc = await query(
    "SELECT id FROM external_accounts WHERE provider = 'gmail' AND provider_user_id = $1",
    [providerUserId]
  );

  let externalAccountId: number;

  if (existingAcc.rowCount) {
    externalAccountId = existingAcc.rows[0].id;
  } else {
    const insertAcc = await query(
      `INSERT INTO external_accounts
       (user_id, provider, provider_user_id, username, email, raw_profile)
       VALUES ($1, 'gmail', $2, $3, $4, $5)
       RETURNING id`,
      [userId, providerUserId, email, email, profile]
    );
    externalAccountId = insertAcc.rows[0].id;
  }

  // 5) Store encrypted tokens in provider_tokens
  await query(
    `INSERT INTO provider_tokens
     (external_account_id, access_token, refresh_token, scope, expires_at, token_type)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      externalAccountId,
      encrypt(accessToken),
      refreshToken ? encrypt(refreshToken) : null,
      tokenJson.scope ?? "",
      tokenJson.expires_in
        ? new Date(Date.now() + tokenJson.expires_in * 1000)
        : null,
      tokenJson.token_type ?? "Bearer",
    ]
  );

  // 6) Issue UCS app_token JWT
  const jwtSecret = process.env.APP_JWT_SECRET;
  if (!jwtSecret) {
    console.error("Missing APP_JWT_SECRET");
    return NextResponse.json(
      { ok: false, error: "MISSING_APP_JWT_SECRET" },
      { status: 500 }
    );
  }

  const expiresSeconds = Number(process.env.APP_JWT_EXPIRES ?? 900); // 15 min default

  const payload = {
    sub: userId,
    providers: ["gmail"],
  };

  const appToken = jwt.sign(payload, jwtSecret, {
    expiresIn: `${expiresSeconds}s`,
  });

  const res = NextResponse.redirect(baseUrl);

  res.cookies.set("app_token", appToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: expiresSeconds,
  });

  return res;
}
