// lib/db helper
import { query } from "@/lib/db";

// 👇 somewhere in your callback, after tokenData + profile are ready

const userId = "demo-user"; // later: real logged-in user id

// 1) UPSERT into external_accounts
const external = await query(
  `
  INSERT INTO external_accounts
    (user_id, provider, provider_user_id, username, email, raw_profile)
  VALUES
    ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (provider, provider_user_id)
  DO UPDATE SET
    user_id  = EXCLUDED.user_id,
    username = EXCLUDED.username,
    email    = EXCLUDED.email,
    raw_profile = EXCLUDED.raw_profile
  RETURNING id;
  `,
  [
    userId,                  // $1
    "discord",               // $2
    profile.id,              // $3 → discord user id
    profile.display_name || profile.username, // $4
    profile.email,           // $5
    JSON.stringify(profile), // $6
  ]
);

const externalAccountId = external.rows[0].id;

// 2) UPSERT into provider_tokens
await query(
  `
  INSERT INTO provider_tokens
    (external_account_id, access_token, refresh_token, expires_at, scopes, created_at)
  VALUES
    ($1, $2, $3, $4, $5, NOW())
  ON CONFLICT (external_account_id)
  DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token= EXCLUDED.refresh_token,
    expires_at   = EXCLUDED.expires_at,
    scopes       = EXCLUDED.scopes,
    updated_at   = NOW();
  `,
  [
    externalAccountId,                  // $1
    tokenData.access_token,             // $2
    tokenData.refresh_token || null,    // $3
    tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null,                           // $4
    tokenData.scope
      ? tokenData.scope.split(" ")
      : null,                           // $5
  ]
);
