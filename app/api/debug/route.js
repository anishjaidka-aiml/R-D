// app/api/debug/route.js
import { query } from '../../../lib/db/index.js';

export async function GET() {
  try {
    const r = await query('SELECT count(*) FROM users');
    const count = Number(r.rows[0].count);
    return new Response(JSON.stringify({ ok: true, count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('DB debug error:', err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
