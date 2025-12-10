// lib/ucs/provider-config.js

export function getProviderConfig(provider) {
  const configs = {
    gmail: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/ucs/gmail/callback`,
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send"
      ]
    },

    discord: {
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/ucs/discord/callback`,
      scope: ["identify", "email"]
    },

    slack: {
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/ucs/slack/callback`,
      scope: ["users:read", "chat:write"]
    }
  };

  const config = configs[provider];

  if (!config) {
    throw new Error(`Provider config not found for: ${provider}`);
  }

  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error(`Missing OAuth env vars for provider: ${provider}`);
  }

  return config;
}
