// app/api/auth/gmail/start/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    `${baseUrl}/api/auth/gmail/callback`;

  if (!clientId || !redirectUri) {
    console.error("Missing GOOGLE_CLIENT_ID or redirectUri");
    return NextResponse.json(
      {
        ok: false,
        error: "MISSING_ENV",
        message: "GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI not set",
      },
      { status: 500 }
    );
  }

  // Scopes: email, profile, and send email
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.send",
  ].join(" ");

  const authorizeUrl =
    "https://accounts.google.com/o/oauth2/v2/auth" +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&access_type=offline` + // get refresh_token
    `&prompt=consent` + // show consent, ensures refresh_token
    `&scope=${encodeURIComponent(scopes)}`;

  return NextResponse.redirect(authorizeUrl);
}
