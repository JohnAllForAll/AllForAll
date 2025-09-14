import type { APIContext } from "astro";
import { createSupabaseServerClient } from "./lib/supabaseServer";

export async function onRequest(context: APIContext, next: () => Promise<Response>) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Skip middleware for API routes and static assets
  if (pathname.startsWith('/api/') || pathname.startsWith('/_') || pathname.includes('.')) {
    return next();
  }

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ["/", "/dashboard", "/upload", "/favorites", "/trending"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || (route !== "/" && pathname.startsWith(route)));

  // Solo permitir /login sin autenticación
  if (pathname !== "/login" && isProtectedRoute) {
    const supabase = createSupabaseServerClient(context.cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.redirect(new URL("/login", context.request.url), 302);
    }
  }

  return next();
}
