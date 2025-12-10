// app/api/ucs/discord/connect/route.js

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!clientId) {
    return new Response(
      JSON.stringify({ error: "DISCORD_CLIENT_ID not set in env" }),
      { status: 500 }
    );
  }

  const redirectUri = `${appUrl}/api/ucs/discord/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "identify email",
    prompt: "consent",
  });

  const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

  return Response.redirect(authUrl);
}
