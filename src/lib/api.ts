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
  try {
    return JSON.parse(text);
  } catch {
    return { success: true };
  }
}
