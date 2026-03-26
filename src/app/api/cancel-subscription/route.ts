import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/client";

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    if (action !== "cancel" && action !== "reactivate") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

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
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    const customer = customers.data[0];

    // Find active subscription
    const allSubs = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 5,
    });

    const subscription = allSubs.data.find(
      (s) => s.status === "active" || s.status === "trialing"
    );

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    if (action === "cancel") {
      // Cancel at period end — user keeps access until the billing period ends
      const updated = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });

      return NextResponse.json({
        success: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: updated.current_period_end,
      });
    } else {
      // Reactivate — undo the pending cancellation
      const updated = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });

      return NextResponse.json({
        success: true,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: updated.current_period_end,
      });
    }
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
