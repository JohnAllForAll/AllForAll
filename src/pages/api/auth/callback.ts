// src/pages/api/auth/callback.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json(); // espera { event, session }
  const session = body?.session;
  if (!session) return new Response('No session provided', { status: 400 });

  const { access_token, refresh_token } = session;
  const secure = import.meta.env.PROD === true;
  cookies.set('sb-access-token', access_token, { path: '/', httpOnly: true, sameSite: 'lax', secure });
  cookies.set('sb-refresh-token', refresh_token, { path: '/', httpOnly: true, sameSite: 'lax', secure });
  return new Response('ok');
};
