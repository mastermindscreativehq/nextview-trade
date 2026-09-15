import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Creates a Supabase server client bound to a middleware request, refreshes
 * the session (rewriting auth cookies when they've rotated), and returns the
 * user plus a response carrying any updated cookies.
 */
export async function updateSession(
  request: NextRequest
): Promise<{ user: { id: string; email?: string | null } | null; response: NextResponse }> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { user: null, response };
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() validates the JWT with Supabase Auth rather than trusting the
  // cookie payload; it is the authoritative "am I authenticated" check.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    user: user ? { id: user.id, email: user.email ?? null } : null,
    response,
  };
}