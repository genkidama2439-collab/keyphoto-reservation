import { BookingFormData } from "@/types";

/**
 * 同一オリジンの Next.js API Route 経由で GAS に予約を送信する。
 * 直接 GAS を叩くと iOS WebView で 302 クロスオリジンリダイレクトが
 * 失敗し "Load failed" になるため、サーバー側で中継する。
 */
export async function submitBooking(
  data: BookingFormData
): Promise<{ success: boolean; message?: string }> {
  const response = await fetch("/api/booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const text = await response.text();
  let result: { success: boolean; message?: string };
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error("サーバーから予期しないレスポンスが返りました");
  }
  if (!response.ok || !result.success) {
    throw new Error(result.message || `予約の登録に失敗しました (${response.status})`);
  }
  return result;
}
