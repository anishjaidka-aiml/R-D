// app/api/ucs/gmail/status/route.ts

export async function GET() {
  try {
    // TODO: later you can read real Gmail token from DB here

    // For now, always report: "no Gmail connected, needs re-auth"
    return Response.json({
      connected: false,
      valid: false,
      needsReauthentication: true,
      email: null,
      expiresAt: null,
    });
  } catch (err) {
    console.error("[GMAIL_STATUS]", err);
    // Still return a safe JSON shape even on error
    return Response.json({
      connected: false,
      valid: false,
      needsReauthentication: true,
      email: null,
      expiresAt: null,
    });
  }
}
