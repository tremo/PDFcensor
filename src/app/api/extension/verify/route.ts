import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/extension/verify
 *
 * Browser extension'dan gelen Pro durumu doğrulama endpoint'i.
 *
 * Extension, cookie-based auth kullanamaz (farklı origin) bu yüzden
 * Supabase access token'ı Authorization header'ında Bearer token olarak gönderir.
 *
 * Flow:
 *   1. Extension, kullanıcıyı pdfcensor.com/login'e yönlendirir (OAuth popup)
 *   2. Login sonrası Supabase session token'ı extension'a iletilir
 *   3. Extension bu token'ı her verify isteğinde Bearer olarak gönderir
 *   4. Bu endpoint token'ı doğrular, profiles.is_pro'yu kontrol eder
 *
 * Request:
 *   Headers: { Authorization: "Bearer <supabase_access_token>" }
 *
 * Response:
 *   200: { isPro: boolean, email: string, expiresAt: string | null }
 *   401: { error: "..." }
 *   500: { error: "..." }
 */
export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.json(
        { error: "Auth service unavailable" },
        { status: 500 }
      );
    }

    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.slice(7);

    // Create a Supabase client authenticated with the user's token
    const supabase = createClient(url, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    });

    // Verify the token by getting the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired token. Please sign in again." },
        { status: 401 }
      );
    }

    // Fetch Pro status from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .single();

    if (profileError) {
      // Profile not found — user exists but no profile row yet
      return NextResponse.json({
        isPro: false,
        email: user.email ?? null,
        expiresAt: null,
      });
    }

    // Optionally check Stripe subscription expiry for more detail
    let expiresAt: string | null = null;
    if (profile.is_pro && process.env.STRIPE_SECRET_KEY) {
      try {
        const { getStripeServer } = await import("@/lib/stripe/client");
        const stripe = getStripeServer();
        const customers = await stripe.customers.list({
          email: user.email!,
          limit: 1,
        });
        if (customers.data.length > 0) {
          const subs = await stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: "active",
            limit: 1,
          });
          if (subs.data.length > 0) {
            expiresAt = new Date(
              subs.data[0].current_period_end * 1000
            ).toISOString();
          }
        }
      } catch {
        // Stripe check failed — still return Pro status from DB
      }
    }

    return NextResponse.json({
      isPro: profile.is_pro ?? false,
      email: user.email ?? null,
      expiresAt,
    });
  } catch (error) {
    console.error("Extension verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
