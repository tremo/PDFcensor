import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/client";

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Auth service unavailable" }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Payment service not configured" }, { status: 500 });
    }

    const stripe = getStripeServer();

    // Find Stripe customer by email
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ status: "no_subscription" });
    }

    const customer = customers.data[0];

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    });

    // Also check for subscriptions that are active but set to cancel
    let subscription = subscriptions.data[0];

    if (!subscription) {
      // Check for canceled-at-period-end subscriptions (still technically active)
      const allSubs = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 5,
      });
      subscription = allSubs.data.find(
        (s) => s.status === "active" || s.status === "trialing"
      ) as typeof subscription;
    }

    if (!subscription) {
      return NextResponse.json({ status: "no_subscription" });
    }

    return NextResponse.json({
      status: "active",
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: subscription.current_period_end,
      interval: subscription.items.data[0]?.price?.recurring?.interval || null,
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json({ error: "Failed to fetch subscription status" }, { status: 500 });
  }
}
