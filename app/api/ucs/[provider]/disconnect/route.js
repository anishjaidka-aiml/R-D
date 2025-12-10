import { deleteCredential } from "@/lib/ucs/credentials";
import { getCurrentUserId } from "@/lib/auth/current-user";

export async function POST(req, { params }) {
  try {
    const { provider } = params;
    const userId = getCurrentUserId();

    await deleteCredential(userId, provider);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("UCS disconnect error:", err);
    return new Response(JSON.stringify({ error: "Failed to disconnect provider" }), { status: 500 });
  }
}
