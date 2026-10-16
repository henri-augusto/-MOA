import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseEnv } from "./env";

const PUBLIC_ARRANGER_PATHS = ["/arranjador/entrar", "/arranjador/cadastro"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured()) return response;

  const { url, publishableKey } = supabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Nothing may run between createServerClient and getClaims, or sessions get dropped at random.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  const isArrangerArea = pathname === "/arranjador" || pathname.startsWith("/arranjador/");
  const isPublicArrangerPath = PUBLIC_ARRANGER_PATHS.some((path) => pathname.startsWith(path));

  if (isArrangerArea && !isPublicArrangerPath && !signedIn) {
    return redirectKeepingCookies(request, response, "/arranjador/entrar");
  }

  if (isPublicArrangerPath && signedIn) {
    return redirectKeepingCookies(request, response, "/arranjador");
  }

  return response;
}

function redirectKeepingCookies(request: NextRequest, source: NextResponse, pathname: string) {
  const target = request.nextUrl.clone();
  target.pathname = pathname;
  target.search = "";

  const redirect = NextResponse.redirect(target);
  source.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}
