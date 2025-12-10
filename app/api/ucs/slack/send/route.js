// app/api/ucs/slack/send/route.js

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import axios from "axios";

// Use your existing aliases so we don't fight relative paths
import { query } from "@/lib/db";
import { decrypt } from "@/lib/auth/crypto";

// Simple health-check so we can hit this route in the browser
export async function GET() {
  return Response.json({
    ok: true,
    route: "ucs-slack-send",
    msg: "Slack send route is reachable",
  });
}

export async function POST() {
  try {
    // 1) Read app_token JWT from cookies
    const cookieStore = cookies();
    const appToken = cookieStore.get("app_token")?.value;

    if (!appToken) {
      return Response.json(
        {
          ok: false,
          error: "Missing app_token cookie. Connect Slack first.",
        },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = jwt.verify(
        appToken,
        process.env.APP_JWT_SECRET || "dev_secret"
      );
    } catch (err) {
      console.error("JWT verify error", err);
      return Response.json(
        { ok: false, error: "Invalid app token" },
        { status: 401 }
      );
    }

    const userId = payload.sub;

    // 2) Find Slack external account for this user
    const eaRes = await query(
      `SELECT id, provider_user_id
       FROM external_accounts
       WHERE user_id = $1 AND provider = 'slack'
       LIMIT 1`,
      [userId]
    );

    if (!eaRes.rowCount) {
      return Response.json(
        { ok: false, error: "No Slack account connected for this user" },
        { status: 400 }
      );
    }

    const externalAccount = eaRes.rows[0];

    // 3) Get most recent Slack access token
    const tokRes = await query(
      `SELECT access_token
       FROM provider_tokens
       WHERE external_account_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [externalAccount.id]
    );

    if (!tokRes.rowCount) {
      return Response.json(
        { ok: false, error: "No Slack token stored for this account" },
        { status: 400 }
      );
    }

    const encryptedAccessToken = tokRes.rows[0].access_token;
    const accessToken = decrypt(encryptedAccessToken);

    // 4) Decide channel (env override → user DM)
    const channel =
      process.env.SLACK_TEST_CHANNEL || externalAccount.provider_user_id;

    const text =
      "👋 Hi from Neevcloud UCS – your Slack connection is working!";

    // 5) Call Slack API
    const slackRes = await axios.post(
      "https://slack.com/api/chat.postMessage",
      { channel, text },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!slackRes.data.ok) {
      console.error("Slack API error", slackRes.data);
      return Response.json(
        {
          ok: false,
          error: "Slack API error",
          slack_error: slackRes.data.error,
        },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      sent: true,
      channel,
      ts: slackRes.data.ts,
    });
  } catch (err) {
    console.error("Slack send route error", err);
    return Response.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
