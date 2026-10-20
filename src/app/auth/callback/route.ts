import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  // Validate next path to prevent open redirects (must be relative)
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check user profile for onboarding status
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch or create profile if needed
        const { data: profile } = await supabase
          .from("profiles")
          .select("settings")
          .eq("id", user.id)
          .single();

        const isOnboarded = profile?.settings?.onboarded === true;

        if (!isOnboarded) {
          return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
        }

        return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
      }
    }
  }

  // Return the user to login with error parameter if exchange failed
  return NextResponse.redirect(new URL("/login?error=auth_failed", requestUrl.origin));
}
