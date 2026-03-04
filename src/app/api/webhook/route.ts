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
      const email = session.customer_details?.email || "";
      const userId = session.metadata?.userId;

      const licenseData = createLicenseData(email);

      // Save to Supabase first, fall back to Redis
      const savedToSupabase = await saveLicenseToSupabase(licenseData, userId);
      if (!savedToSupabase) {
        await saveLicenseToRedis(licenseData);
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
