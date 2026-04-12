import { NextResponse } from "next/server";

const GAS_URL = process.env.GAS_URL || process.env.NEXT_PUBLIC_GAS_URL || "";

export async function POST(request: Request) {
  if (!GAS_URL) {
    return NextResponse.json(
      { success: false, message: "GAS URL が設定されていません" },
      { status: 500 }
    );
  }

  let body: string;
  try {
    body = JSON.stringify(await request.json());
  } catch {
    return NextResponse.json(
      { success: false, message: "リクエストの読み取りに失敗しました" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: `GAS エラー: ${res.status}` },
        { status: 502 }
      );
    }

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({
        success: false,
        message: "GAS から予期しないレスポンスが返りました",
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: `ネットワークエラー: ${message}` },
      { status: 502 }
    );
  }
}
