// lib/supabase/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "./server";

export async function withAuthProtection(
  req: NextRequest,
  requiredRoles: string[] = []
): Promise<NextResponse | { user: any; role: string }> {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    const redirectUrl = new URL("/signin", req.url);
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    const url = new URL("/unauthorized", req.url);
    url.searchParams.set("role", "unknown");
    return NextResponse.redirect(url);
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(profile.role)) {
    const url = new URL("/unauthorized", req.url);
    url.searchParams.set("role", profile.role);
    return NextResponse.redirect(url);
  }

  return { user, role: profile.role };
}
