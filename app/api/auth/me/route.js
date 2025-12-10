export async function GET() {
  return new Response(
    JSON.stringify({ ok: true, route: "me", msg: "me route compiling" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
