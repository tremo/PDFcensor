import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { key } = await request.json();

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { valid: false, error: "Invalid license key" },
        { status: 400 }
      );
    }

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      return NextResponse.json(
        { valid: false, error: "License service unavailable" },
        { status: 503 }
      );
    }

    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });
    const data = await redis.get(`license:${key}`);

    if (!data) {
      return NextResponse.json({ valid: false });
    }

    const license = typeof data === "string" ? JSON.parse(data) : data;

    if (!license.active) {
      return NextResponse.json({ valid: false, error: "License deactivated" });
    }

    if (license.expires && new Date(license.expires) < new Date()) {
      return NextResponse.json({ valid: false, error: "License expired" });
    }

    return NextResponse.json({ valid: true, email: license.email });
  } catch (error) {
    console.error("License validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Validation failed" },
      { status: 500 }
    );
  }
}
