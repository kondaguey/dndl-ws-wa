import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// FIX: Renamed from 'middleware' to 'proxy'
export async function proxy(request) {
  // 1. Create the base response
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. Configure Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Check Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // --- PROTECTION LOGIC ---

  // 4. PROTECT ADMIN
  if (url.pathname.startsWith("/admin") && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", url.pathname);

    // FIX: Use the redirect but COPY the cookies from supabaseResponse
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  // 5. AUTH REDIRECT
  if (url.pathname === "/login" && user) {
    const nextPath =
      request.nextUrl.searchParams.get("next") || "/admin/scheduler";
    url.pathname = nextPath;

    // FIX: Use the redirect but COPY the cookies from supabaseResponse
    const redirectResponse = NextResponse.redirect(url);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  return supabaseResponse;
}

// --- HELPER FUNCTION ---
function copyCookies(sourceResponse, destResponse) {
  const cookies = sourceResponse.cookies.getAll();
  cookies.forEach((cookie) => {
    destResponse.cookies.set(cookie.name, cookie.value, cookie);
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
