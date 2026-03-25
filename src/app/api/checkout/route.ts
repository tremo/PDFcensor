import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { locales } from "@/lib/i18n/config";
import type Stripe from "stripe";

const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || "price_1TDl2RAej1A7idfqmbhyQDSh",
  yearly: process.env.STRIPE_PRICE_YEARLY || "price_1TErzlAej1A7idfq9GmrbS7l",
};

export async function POST(request: Request) {
  try {
    const { locale: rawLocale = "en", plan = "monthly" } = await request.json();
    const locale = locales.includes(rawLocale) ? rawLocale : "en";
    const priceId = plan === "yearly" ? PRICE_IDS.yearly : PRICE_IDS.monthly;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }

    const stripe = getStripeServer();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Get current user from Supabase session — authentication required
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Auth service unavailable" },
        { status: 500 }
      );
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in again." },
        { status: 401 }
      );
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/${locale}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${locale}/pricing`,
      metadata: {
        locale,
        userId: user.id,
      },
    };

    if (user.email) {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);

    // Avoid 502/503 status — Vercel replaces those with its own HTML error pages,
    // which breaks response.json() on the client side.
    if (error instanceof Error && "type" in error) {
      const stripeError = error as Stripe.errors.StripeError;
      const message =
        stripeError.type === "StripeAuthenticationError"
          ? "Payment service configuration error. Please contact support."
          : stripeError.type === "StripeConnectionError"
            ? "Payment service temporarily unavailable. Please try again."
            : "Failed to create checkout session";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
