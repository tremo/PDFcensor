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
    console.error("Supabase not configured, license not persisted");
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

  // Insert license (use upsert on key to prevent duplicates)
  const { error: licenseError } = await supabase.from("licenses").upsert(
    {
      key: licenseData.key,
      email: licenseData.email,
      user_id: resolvedUserId || null,
      active: licenseData.active,
      expires_at: licenseData.expires,
    },
    { onConflict: "key" }
  );

  if (licenseError) {
    console.error("Failed to save license:", licenseError.message);
    return false;
  }

  // Update profile to Pro
  if (resolvedUserId) {
    await supabase
      .from("profiles")
      .update({ is_pro: true, updated_at: new Date().toISOString() })
      .eq("id", resolvedUserId);
  }

  return true;
}

// Check if a Stripe session was already processed (idempotency via Supabase)
async function checkSessionProcessed(sessionId: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return false;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data } = await supabase
      .from("licenses")
      .select("id")
      .eq("key", `session:${sessionId}`)
      .limit(1);
    return (data && data.length > 0) || false;
  } catch {
    return false;
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

      // Idempotency: check if license already exists for this session
      const alreadyProcessed = await checkSessionProcessed(sessionId);
      if (alreadyProcessed) {
        return NextResponse.json({ received: true });
      }

      const licenseData = createLicenseData(email);

      // Save to Supabase (upsert prevents duplicates)
      await saveLicenseToSupabase(licenseData, userId);
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
