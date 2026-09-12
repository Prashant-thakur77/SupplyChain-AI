/**
 * Batch risk prediction proxy — forwards CSV upload to FastAPI /api/predict/batch
 */

import { NextRequest, NextResponse } from "next/server";

const BASE =
  process.env.RISK_MODEL_API_URL?.replace(/\/+$/, "") ??
  "http://localhost:8001";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No CSV file provided" },
        { status: 400 },
      );
    }

    // Forward the file as multipart/form-data to FastAPI
    const upstream = new FormData();
    upstream.append("file", file);

    const res = await fetch(`${BASE}/api/predict/batch`, {
      method: "POST",
      body: upstream,
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: "Batch prediction failed", detail },
        { status: res.status },
      );
    }

    const result = await res.json();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        error: "Cannot reach the risk model API. Ensure the FastAPI server is running on " + BASE,
      },
      { status: 503 },
    );
  }
}
