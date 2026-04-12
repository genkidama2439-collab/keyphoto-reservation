"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initLiff, closeLiff } from "@/lib/liff";

export default function CompletePage() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState("");

  useEffect(() => {
    initLiff();
    const stored = sessionStorage.getItem("lastBookingId");
    if (stored) {
      setBookingId(stored);
      sessionStorage.removeItem("lastBookingId");
    }
  }, []);

  async function handleClose() {
    const closed = await closeLiff();
    if (!closed) {
      router.push("/");
    }
  }

  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#c9a84c]/20">
        <span className="text-4xl text-[#c9a84c]">&#10003;</span>
      </div>
      <h1 className="mb-3 text-2xl font-bold text-white">
        ご予約ありがとうございます
      </h1>
      {bookingId && (
        <p className="mb-4 rounded-lg bg-[#c9a84c]/10 px-4 py-2 text-sm text-[#c9a84c]">
          予約ID: <span className="font-mono font-bold">{bookingId}</span>
        </p>
      )}
      <p className="mb-2 text-white/70">
        予約内容をLINEでお送りしました。
      </p>
      <p className="mb-8 text-sm text-white/50">
        天候等により日程変更が必要な場合は、LINEにてご連絡いたします。
      </p>
      <button
        onClick={handleClose}
        className="rounded-lg bg-[#c9a84c] px-8 py-3 font-bold text-[#0a1628] transition hover:bg-[#d4b85e] active:scale-[0.98]"
      >
        閉じる
      </button>
    </div>
  );
}
