// lib/connectors/slack.js

import axios from "axios";
import qs from "qs"; // if you use it for exchangeCode, keep it

// 1) exchangeCode: swap code -> tokens
async function exchangeCode(code, redirectUri) {
  const body = {
    code,
    redirect_uri: redirectUri,
    client_id: process.env.SLACK_CLIENT_ID,
    client_secret: process.env.SLACK_CLIENT_SECRET,
  };

  const res = await axios.post(
    "https://slack.com/api/oauth.v2.access",
    qs.stringify(body),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  if (!res.data || !res.data.ok) {
    throw new Error(
      "Slack oauth.v2.access failed: " + (res.data && res.data.error)
    );
  }

  return res.data;
}

// 2) getProfile: the version we wrote earlier
async function getProfile(accessToken) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  const authRes = await axios.get("https://slack.com/api/auth.test", {
    headers,
  });
  if (!authRes.data || !authRes.data.ok) {
    throw new Error(
      "Slack auth.test failed: " + (authRes.data && authRes.data.error)
    );
  }
  const userId = authRes.data.user_id;

  const profileRes = await axios.get(
    "https://slack.com/api/users.profile.get",
    { headers }
  );
  if (!profileRes.data || !profileRes.data.ok) {
    throw new Error(
      "Slack users.profile.get failed: " +
        (profileRes.data && profileRes.data.error)
    );
  }

  const p = profileRes.data.profile || {};

  return {
    id: userId,
    email: p.email || null,
    username:
      p.real_name_normalized ||
      p.real_name ||
      p.display_name_normalized ||
      p.display_name ||
      null,
    display_name:
      p.display_name_normalized ||
      p.display_name ||
      p.real_name_normalized ||
      p.real_name ||
      null,
    raw: {
      auth: authRes.data,
      profile: profileRes.data,
    },
  };
}

// ✅ THIS is the object we want to export
export const slackConnector = {
  id: "slack",
  name: "Slack",
  exchangeCode,
  getProfile,
};
