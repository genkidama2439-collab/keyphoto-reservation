import { BookingFormData } from "@/types";

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || "";

export async function submitBooking(data: BookingFormData): Promise<{ success: boolean; message?: string }> {
  if (!GAS_URL) {
    throw new Error("GAS_URL is not configured");
  }

  const response = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("予約の送信に失敗しました");
  }

  return response.json();
}
