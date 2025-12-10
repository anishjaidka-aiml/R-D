// app/api/ucs/me/route.js

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { query } from "../../../../lib/db";

/**
 * GET /api/ucs/me
 * Returns the current UCS user + connected providers.
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("app_token")?.value;

    if (!token) {
      return Response.json(
        { ok: false, error: "NO_TOKEN", message: "Missing app_token cookie" },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = jwt.verify(
        token,
        process.env.APP_JWT_SECRET || "dev_secret"
      );
    } catch (err) {
      console.error("UCS /me invalid token", err);
      return Response.json(
        { ok: false, error: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    const userId = payload.sub;
    if (!userId) {
      return Response.json(
        { ok: false, error: "NO_USER_ID_IN_TOKEN" },
        { status: 400 }
      );
    }

    // 1) Load user
    const userRes = await query(
      "SELECT id, email, display_name FROM users WHERE id = $1",
      [userId]
    );

    if (!userRes.rowCount) {
      return Response.json(
        { ok: false, error: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const user = userRes.rows[0];

    // 2) Load external accounts for this user
    const accountsRes = await query(
      `
      SELECT provider, provider_user_id, username, email
      FROM external_accounts
      WHERE user_id = $1
      ORDER BY provider ASC
    `,
      [userId]
    );

    const accounts = accountsRes.rows;

    const providers = accounts.map((a) => a.provider);

    return Response.json(
      {
        ok: true,
        user,
        accounts,
        providers,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("UCS /me server error", err);
    return Response.json(
      { ok: false, error: "SERVER_ERROR", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
