import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabaseServer';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const body = await request.json();
  const email = body.email;
  const password = body.password;
  const username = body.username || null;

  if (!email || !password) {
    return new Response('Email y contraseña requeridos', { status: 400 });
  }

  const supabase = createSupabaseServerClient(cookies);

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    return new Response(error.message, { status: 400 });
  }

  // Insertar perfil después del registro exitoso
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        username: username || `usuario_${data.user.id.slice(0, 8)}`,
        avatar_url: null
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // No fallar el registro si falla la creación del perfil
    }
  }

  if (data.session) {
    // Usuario confirmado automáticamente
    return redirect('/dashboard');
  }

  // Usuario necesita confirmar email
  return new Response('Revisa tu correo para confirmar el registro.', { status: 200 });
};
