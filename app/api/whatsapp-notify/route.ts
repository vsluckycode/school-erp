import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, studentName, time } = body;

    const waServer = process.env.WA_SERVER_URL;
    if (!waServer) {
      return NextResponse.json({ ok: false, error: "WA_SERVER_URL not set" }, { status: 500 });
    }

    const res = await fetch(`${waServer}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, studentName, time }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
