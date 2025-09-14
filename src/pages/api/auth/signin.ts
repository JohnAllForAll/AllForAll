import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabaseServer';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    let body: Record<string, any>;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {};
      for (const [key, value] of formData.entries()) {
        body[key] = value;
      }
    } else {
      // For traditional form submissions without content-type, try to parse as form data
      try {
        const formData = await request.formData();
        body = {};
        for (const [key, value] of formData.entries()) {
          body[key] = value;
        }
      } catch {
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Error - Tipo de contenido no soportado</title>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.location.href = '/login?error=unsupported_content_type';
                  }, 3000);
                }
              </script>
            </head>
            <body style="background: #1a1a2e; color: white; font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>Error: Tipo de contenido no soportado</h1>
              <p>Redirigiendo al login...</p>
            </body>
          </html>
        `, {
          status: 415,
          headers: { 'Content-Type': 'text/html' }
        });
      }
    }

    const email = body.email;
    const password = body.password;

    if (!email || !password) {
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error - Campos requeridos</title>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.location.href = '/login?error=missing_credentials';
                }, 3000);
              }
            </script>
          </head>
          <body style="background: #1a1a2e; color: white; font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Error: Email y contraseña son requeridos</h1>
            <p>Redirigiendo al login...</p>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const supabase = createSupabaseServerClient(cookies);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      let errorMessage = 'Error de autenticación';
      let errorCode = 'auth_error';

      if (signInError.message.includes('Invalid login credentials')) {
        errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
        errorCode = 'invalid_credentials';
      } else if (signInError.message.includes('Email not confirmed')) {
        errorMessage = 'Por favor confirma tu email antes de iniciar sesión.';
        errorCode = 'email_not_confirmed';
      }

      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error de autenticación</title>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.location.href = '/login?error=${errorCode}';
                }, 3000);
              }
            </script>
          </head>
          <body style="background: #1a1a2e; color: white; font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>${errorMessage}</h1>
            <p>Redirigiendo al login...</p>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (!data.session) {
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error - Sesión no creada</title>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.location.href = '/login?error=no_session';
                }, 3000);
              }
            </script>
          </head>
          <body style="background: #1a1a2e; color: white; font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Error: No se pudo crear la sesión</h1>
            <p>Redirigiendo al login...</p>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Successful login - redirect to dashboard page
    return redirect('/', 302);
  } catch (error) {
    console.error('Login error:', error);
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error interno del servidor</title>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.location.href = '/login?error=server_error';
              }, 3000);
            }
          </script>
        </head>
        <body style="background: #1a1a2e; color: white; font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Error interno del servidor</h1>
          <p>Redirigiendo al login...</p>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
};
