// lib/connectors/discord.js
import axios from "axios";

const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_USER_URL = "https://discord.com/api/users/@me";

export const discordConnector = {
  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code, redirectUri) {
    const params = new URLSearchParams();
    params.append("client_id", process.env.DISCORD_CLIENT_ID);
    params.append("client_secret", process.env.DISCORD_CLIENT_SECRET);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);

    const res = await axios.post(DISCORD_TOKEN_URL, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return res.data; // access_token, refresh_token, expires_in, scope, token_type
  },

  /**
   * Get user profile
   */
  async getProfile(accessToken) {
    const res = await axios.get(DISCORD_USER_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const raw = res.data;

    return {
      id: raw.id,
      email: raw.email || null,
      username: raw.username,
      display_name: raw.global_name || raw.username,
      raw,
    };
  },
};
