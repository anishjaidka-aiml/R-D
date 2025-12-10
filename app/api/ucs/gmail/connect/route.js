import { getProviderConfig } from "@/lib/ucs/provider-config";

export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const config = await getProviderConfig("gmail");

    const redirectUri = `${appUrl}${config.redirect_path}`;

    const params = new URLSearchParams({
      client_id: config.client_id,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: config.scopes.join(" "),
      access_type: "offline",
      prompt: "consent"
    });

    const authUrl = `${config.auth_url}?${params.toString()}`;

    return Response.redirect(authUrl);
  } catch (err) {
    console.error("Gmail connect error:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to initiate Gmail OAuth",
        message: err.message || "Internal error"
      }),
      { status: 500 }
    );
  }
}
