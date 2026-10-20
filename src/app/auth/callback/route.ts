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
          .select("settings, id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          const displayName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Learner";
          const avatarUrl =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;

          await supabase.from("profiles").upsert(
            {
              id: user.id,
              display_name: displayName,
              avatar_url: avatarUrl,
              timezone: "Asia/Kolkata",
              preferred_ai: "chatgpt",
              settings: { onboarded: true },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        }

        const isOnboarded = profile ? profile?.settings?.onboarded === true : true;

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
