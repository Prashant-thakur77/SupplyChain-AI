/**
 * API Proxy — bridges Next.js ↔ Market-Supply FastAPI (XGBoost risk model)
 *
 * GET  → returns model metadata + dropdown options (merged)
 * POST → forwards a single-order payload to FastAPI /api/predict
 */

import { NextRequest, NextResponse } from "next/server";

const BASE =
  process.env.RISK_MODEL_API_URL?.replace(/\/+$/, "") ??
  "http://localhost:8001";

/* ────────────────────────────────────────────────────── */
/* GET — model meta + form option lists                   */
/* ────────────────────────────────────────────────────── */
export async function GET() {
  try {
    const [metaRes, optionsRes] = await Promise.all([
      fetch(`${BASE}/api/meta`,    { cache: "no-store" }),
      fetch(`${BASE}/api/options`, { cache: "no-store" }),
    ]);

    if (!metaRes.ok || !optionsRes.ok) {
      return NextResponse.json(
        { error: "Risk model API unavailable" },
        { status: 502 },
      );
    }

    const meta    = await metaRes.json();
    const options = await optionsRes.json();

    return NextResponse.json({ meta, options });
  } catch {
    return NextResponse.json(
      {
        error: "Cannot reach the risk model API. Ensure the FastAPI server is running on " + BASE,
      },
      { status: 503 },
    );
  }
}

/* ────────────────────────────────────────────────────── */
/* POST — single-order prediction                         */
/* ────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${BASE}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: "Prediction failed", detail },
        { status: res.status },
      );
    }

    const prediction = await res.json();
    return NextResponse.json(prediction);
  } catch {
    return NextResponse.json(
      {
        error: "Cannot reach the risk model API. Ensure the FastAPI server is running on " + BASE,
      },
      { status: 503 },
    );
  }
}
