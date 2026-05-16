import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/middleware";



// ============================================
// ROUTE GROUPS
// ============================================

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/verify-otp",
  "/select-role",
  "/workers",
];

const AUTH_ROUTES = ["/login", "/register"];

const WORKER_ROUTES = [
  "/profile/create",
  "/profile/edit",
];

const ADMIN_ROUTES = ["/admin"];

const WEBHOOK_ROUTES = ["/api/webhooks"];

// ============================================
// HELPERS
// ============================================

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
}

function isWorkerRoute(pathname: string): boolean {
  return WORKER_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
}

function isWebhookRoute(pathname: string): boolean {
  return WEBHOOK_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
}

// ============================================
// PROXY
// ============================================

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================
  // SKIP WEBHOOKS
  // ============================================

  if (isWebhookRoute(pathname)) {
    return NextResponse.next();
  }

  // ============================================
  // SKIP STATIC FILES
  // ============================================

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ============================================
  // CREATE SUPABASE SESSION
  // ============================================

  const { supabase, response } = updateSession(request);

  // IMPORTANT:
  // This refreshes the auth session
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // ============================================
  // NOT LOGGED IN
  // ============================================

  if (!authUser) {
    // Allow public routes
    if (isPublicRoute(pathname)) {
      return response;
    }

    // Redirect protected routes to login
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  // ============================================
  // FETCH USER DATA
  // ============================================

  const { data: user } = await supabase
    .from("users")
    .select(`
      role,
      phone_verified,
      is_banned,
      is_active
    `)
    .eq("auth_id", authUser.id)
    .single();

  // ============================================
  // BANNED / DISABLED USER
  // ============================================

  if (!user || user.is_banned || !user.is_active) {
    await supabase.auth.signOut();

    return NextResponse.redirect(
      new URL("/login?error=banned", request.url)
    );
  }

  // ============================================
  // PHONE NOT VERIFIED
  // ============================================

  if (
    !user.phone_verified &&
    pathname !== "/verify-otp"
  ) {
    return NextResponse.redirect(
      new URL("/verify-otp", request.url)
    );
  }

  // ============================================
  // ROLE NOT SELECTED
  // ============================================

  if (
    user.phone_verified &&
    !user.role &&
    pathname !== "/select-role"
  ) {
    return NextResponse.redirect(
      new URL("/select-role", request.url)
    );
  }

  // ============================================
  // AUTH PAGES AFTER LOGIN
  // ============================================

  if (
    isAuthRoute(pathname) &&
    user.phone_verified &&
    user.role
  ) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  // ============================================
  // WORKER ROUTES
  // ============================================

  if (
    isWorkerRoute(pathname) &&
    user.role !== "worker"
  ) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  // ============================================
  // ADMIN ROUTES
  // ============================================

  if (isAdminRoute(pathname)) {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (
      !authUser.email ||
      authUser.email !== adminEmail
    ) {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }
  }

  return response;
}

// ============================================
// MATCHER
// ============================================

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};