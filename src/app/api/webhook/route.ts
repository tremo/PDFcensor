import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripeServer } from "@/lib/stripe/client";
import { createLicenseData } from "@/lib/stripe/license";

// Upstash Redis - optional (gracefully handle if not configured)
async function saveLicense(licenseData: { key: string; email: string; created: string; expires: string | null; active: boolean }) {
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

      const licenseData = createLicenseData(email);
      await saveLicense(licenseData);

      console.log("License created:", licenseData.key, "for", email);
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
