import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripeServer } from "@/lib/stripe/client";
import { createLicenseData } from "@/lib/stripe/license";

// Save license to Supabase and activate Pro status
async function saveLicenseToSupabase(
  licenseData: { key: string; email: string; created: string; expires: string | null; active: boolean },
  userId?: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn("Supabase not configured, falling back to Redis");
    return false;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceKey);

  // Find user by userId from metadata, or by email
  let resolvedUserId = userId;
  if (!resolvedUserId && licenseData.email) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", licenseData.email)
      .limit(1);
    if (profiles && profiles.length > 0) {
      resolvedUserId = profiles[0].id;
    }
  }

  // Insert license
  await supabase.from("licenses").insert({
    key: licenseData.key,
    email: licenseData.email,
    user_id: resolvedUserId || null,
    active: licenseData.active,
    expires_at: licenseData.expires,
  });

  // Update profile to Pro
  if (resolvedUserId) {
    await supabase
      .from("profiles")
      .update({ is_pro: true, updated_at: new Date().toISOString() })
      .eq("id", resolvedUserId);
  }

  return true;
}

// Upstash Redis fallback
async function saveLicenseToRedis(licenseData: { key: string; email: string; created: string; expires: string | null; active: boolean }) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("Upstash Redis not configured, license not persisted");
    return;
  }

  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({ url, token });
  await redis.set(`license:${licenseData.key}`, JSON.stringify(licenseData));
}

async function checkSessionProcessed(sessionId: string): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;

  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });
    const exists = await redis.exists(`processed_session:${sessionId}`);
    return exists === 1;
  } catch {
    return false;
  }
}

async function markSessionProcessed(sessionId: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });
    // Expire after 30 days (Stripe retries don't last that long)
    await redis.set(`processed_session:${sessionId}`, "1", { ex: 60 * 60 * 24 * 30 });
  } catch {
    // Non-fatal: worst case is a duplicate license, which is recoverable
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  try {
    const stripe = getStripeServer();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const sessionId = session.id;
      const email = session.customer_details?.email || "";
      const userId = session.metadata?.userId;

      // Idempotency: skip if this session was already processed
      const alreadyProcessed = await checkSessionProcessed(sessionId);
      if (alreadyProcessed) {
        return NextResponse.json({ received: true });
      }

      const licenseData = createLicenseData(email);

      // Save to Supabase first, fall back to Redis
      const savedToSupabase = await saveLicenseToSupabase(licenseData, userId);
      if (!savedToSupabase) {
        await saveLicenseToRedis(licenseData);
      }

      // Mark session as processed to prevent duplicate license creation on retries
      await markSessionProcessed(sessionId);
    }

    if (
      event.type === "customer.subscription.deleted" ||
      event.type === "invoice.payment_failed"
    ) {
      const obj = event.data.object as { customer_email?: string; customer?: string };
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && serviceKey) {
        const stripe = getStripeServer();
        let email = obj.customer_email;

        // Fetch customer email from Stripe if not directly available
        if (!email && obj.customer) {
          try {
            const customer = await stripe.customers.retrieve(obj.customer as string);
            if (!("deleted" in customer)) email = customer.email ?? undefined;
          } catch {
            // non-fatal
          }
        }

        if (email) {
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(supabaseUrl, serviceKey);

          const { data: profiles } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .limit(1);

          if (profiles && profiles.length > 0) {
            await supabase
              .from("profiles")
              .update({ is_pro: false, updated_at: new Date().toISOString() })
              .eq("id", profiles[0].id);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
