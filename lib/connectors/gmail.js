// lib/connectors/gmail.js
import axios from "axios";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export const gmailConnector = {
  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code, redirectUri) {
    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const res = await axios.post(TOKEN_URL, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Returns: access_token, refresh_token, expires_in, scope, token_type, etc.
    return res.data;
  },

  /**
   * Fetch user profile using access token
   */
  async getProfile(accessToken) {
    const res = await axios.get(USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const raw = res.data;

    return {
      id: raw.id || raw.sub,
      email: raw.email || null,
      username: raw.email || null,
      display_name: raw.name || raw.email || null,
      raw,
    };
  },
};
