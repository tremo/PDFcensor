import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/extension/refresh
 *
 * Extension'dan gelen token yenileme proxy'si.
 *
 * Extension direkt Supabase GoTrue endpoint'ine erişemez çünkü:
 *   - Supabase URL extension'da expose edilmemeli
 *   - CORS sınırlamaları
 *   - Server-side proxy rate limiting uygulayabilir
 *
 * Request:
 *   Body: { refreshToken: string }
 *
 * Response:
 *   200: { accessToken, refreshToken, expiresIn }
 *   400: { error: "..." }
 *   500: { error: "..." }
 */
export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.json(
        { error: "Auth service unavailable" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body?.refreshToken || typeof body.refreshToken !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid refreshToken" },
        { status: 400 }
      );
    }

    // Proxy the refresh request to Supabase GoTrue
    const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ refresh_token: body.refreshToken }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Supabase refresh error:", error);
      return NextResponse.json(
        { error: "Token refresh failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 3600,
    });
  } catch (error) {
    console.error("Extension refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
