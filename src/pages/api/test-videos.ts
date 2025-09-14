import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabaseServer';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const supabase = createSupabaseServerClient(cookies);

    // Test videos query
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .limit(5);

    // Test user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    return new Response(JSON.stringify({
      success: true,
      user: user ? { id: user.id, email: user.email } : null,
      userError: userError?.message || null,
      videos: videos || [],
      videosError: videosError?.message || null,
      videosCount: videos?.length || 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Test error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
