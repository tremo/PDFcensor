import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { locales } from "@/lib/i18n/config";

export async function POST(request: Request) {
  try {
    const { locale: rawLocale = "en" } = await request.json();
    const locale = locales.includes(rawLocale) ? rawLocale : "en";
    const stripe = getStripeServer();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Get current user from Supabase session — authentication required
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Auth service unavailable" },
        { status: 503 }
      );
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "OfflineRedact Pro",
              description:
                "No watermark, batch processing (ZIP download), and priority support. Cancel anytime.",
            },
            unit_amount: 699, // $6.99
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/${locale}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${locale}/pricing`,
      customer_email: user.email!,
      metadata: {
        locale,
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
