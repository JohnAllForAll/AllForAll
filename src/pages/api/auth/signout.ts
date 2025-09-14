import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabaseServer';

export const prerender = false;

/**
 * POST /api/auth/signout
 * Maneja el cierre de sesión con Supabase
 */
export const POST: APIRoute = async ({ cookies, redirect }) => {
  console.log('🔐 SIGNOUT API: Inicio del proceso de logout');

  try {
    const supabase = createSupabaseServerClient(cookies);

    // Revisar usuario antes de cerrar sesión
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    console.log('🔐 SIGNOUT API: Usuario actual antes de logout:', currentUser?.id || 'No user');

    // Ejecutar logout
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ SIGNOUT API: Error en supabase.auth.signOut:', error);
    } else {
      console.log('✅ SIGNOUT API: Logout en Supabase exitoso');
    }

    // Revisar usuario después de logout
    const { data: { user: afterUser } } = await supabase.auth.getUser();
    console.log('🔐 SIGNOUT API: Usuario después de logout:', afterUser?.id || 'No user (esperado)');

    // Lista de cookies a borrar
    const cookieNames = ['sb-access-token', 'sb-refresh-token', 'sb-auth-token'];

    // Agregar cookie dependiente del anon key (por si aplica)
    const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) {
      const encodedKey = anonKey.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      cookieNames.push(`sb-${encodedKey}-auth-token`);
    }

    console.log('🧹 SIGNOUT API: Eliminando cookies:', cookieNames);

    for (const cookieName of cookieNames) {
      cookies.delete(cookieName, { path: '/' });
      cookies.delete(cookieName, { path: '/', httpOnly: true, sameSite: 'lax', secure: true });
    }

    console.log('✅ SIGNOUT API: Cookies eliminadas');

    // Devolver respuesta HTML que limpia storage y redirige
    return new Response(`<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Cerrando sesión...</title>
          <script>
            console.log('🌐 CLIENT: Limpieza en cliente iniciada');

            // Limpiar localStorage
            try {
              let localCleared = 0;
              Object.keys(localStorage).forEach(key => {
                if (key.includes('supabase') || key.includes('sb-')) {
                  localStorage.removeItem(key);
                  localCleared++;
                }
              });
              console.log('🗂️ CLIENT: Eliminados', localCleared, 'items de localStorage');
            } catch(e) { console.warn('⚠️ CLIENT: No se pudo limpiar localStorage:', e); }

            // Limpiar sessionStorage
            try {
              let sessionCleared = 0;
              Object.keys(sessionStorage).forEach(key => {
                if (key.includes('supabase') || key.includes('sb-')) {
                  sessionStorage.removeItem(key);
                  sessionCleared++;
                }
              });
              console.log('🗂️ CLIENT: Eliminados', sessionCleared, 'items de sessionStorage');
            } catch(e) { console.warn('⚠️ CLIENT: No se pudo limpiar sessionStorage:', e); }

            console.log('✅ CLIENT: Limpieza completa, redirigiendo...');
            setTimeout(() => { window.location.href = '/login'; }, 100);
          </script>
        </head>
        <body style="background: #1a1a2e; color: white; font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Cerrando sesión...</h1>
          <p>Redirigiendo a la página de login</p>
        </body>
      </html>`, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('❌ SIGNOUT API: Error inesperado en logout:', error);
    return redirect('/login');
  }
};

/**
 * GET /api/auth/signout
 * Permite cerrar sesión accediendo directamente a la URL
 */
export const GET: APIRoute = async ({ cookies, redirect }) => {
  console.log('🔐 SIGNOUT API: GET signout llamado');

  try {
    const supabase = createSupabaseServerClient(cookies);
    const { error } = await supabase.auth.signOut();
    if (error) console.error('❌ SIGNOUT API (GET):', error);

    // Borrar cookies
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    cookies.delete('sb-auth-token', { path: '/' });

    console.log('✅ SIGNOUT API (GET): Cookies eliminadas, redirigiendo');
    return redirect('/login');
  } catch (error) {
    console.error('❌ SIGNOUT API (GET): Error inesperado:', error);
    return redirect('/login');
  }
};
