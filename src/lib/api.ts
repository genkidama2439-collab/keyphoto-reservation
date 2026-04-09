import { BookingFormData } from "@/types";

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || "";

export async function submitBooking(
  data: BookingFormData
): Promise<{ success: boolean; message?: string }> {
  if (!GAS_URL) {
    throw new Error("GAS_URL is not configured");
  }

  // GASのWebアプリへのPOSTはCORSプリフライトを避けるため
  // Content-Type: text/plain を使用する必要がある
  const response = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(data),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`送信失敗: ${response.status}`);
  }

  const text = await response.text();
  let result: { success: boolean; message?: string };
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error("サーバーから予期しないレスポンスが返りました");
  }
  if (!result.success) {
    throw new Error(result.message || "予約の登録に失敗しました");
  }
  return result;
}
