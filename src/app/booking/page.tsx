import { Suspense } from "react";
import BookingForm from "@/components/BookingForm";

export default function BookingPage() {
  return (
    <div>
      <h1 className="mb-6 text-center text-xl font-bold text-white">
        予約フォーム
      </h1>
      <Suspense fallback={<div className="text-center text-white/50">読み込み中...</div>}>
        <BookingForm />
      </Suspense>
    </div>
  );
}
