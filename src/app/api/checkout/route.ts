import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { locales } from "@/lib/i18n/config";
import type Stripe from "stripe";

const PRICE_IDS = {
  eur: {
    monthly: process.env.STRIPE_PRICE_EUR_MONTHLY || "price_1TFsdYAej1A7idfqHtRVevzF",
    yearly: process.env.STRIPE_PRICE_EUR_YEARLY || "price_1TFsdZAej1A7idfqUph9lrAI",
  },
  usd: {
    monthly: process.env.STRIPE_PRICE_USD_MONTHLY || "price_1TFsdVAej1A7idfqYs44IJCW",
    yearly: process.env.STRIPE_PRICE_USD_YEARLY || "price_1TFsdYAej1A7idfq2ROCXvY7",
  },
};

export async function POST(request: Request) {
  try {
    const { locale: rawLocale = "en", plan = "monthly" } = await request.json();
    const locale = locales.includes(rawLocale) ? rawLocale : "en";
    const currency = locale === "en" ? "usd" : "eur";
    const prices = PRICE_IDS[currency];
    const priceId = plan === "yearly" ? prices.yearly : prices.monthly;

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
    const errMsg = error instanceof Error ? error.message : String(error);
    const errType = error instanceof Error && "type" in error
      ? (error as Stripe.errors.StripeError).type
      : "unknown";
    console.error("CHECKOUT_FAIL type:", errType);
    console.error("CHECKOUT_FAIL msg:", errMsg);

    return NextResponse.json(
      { error: errType === "StripeAuthenticationError"
          ? "Payment service configuration error. Please contact support."
          : "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
