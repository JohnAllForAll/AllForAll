import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: import.meta.env.MODE
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    return new Response(JSON.stringify({
      message: 'POST test successful',
      received: {
        email: body.email ? 'present' : 'missing',
        password: body.password ? 'present' : 'missing'
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to parse request body',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
