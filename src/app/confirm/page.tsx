"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { plans, transferOption } from "@/data/plans";
import { BookingFormData } from "@/types";
import { submitBooking } from "@/lib/api";

export default function ConfirmPage() {
  const router = useRouter();
  const [data, setData] = useState<BookingFormData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("bookingData");
    if (!stored) {
      router.replace("/booking");
      return;
    }
    try {
      // sessionStorage はブラウザ外部ストアなので、
      // マウント時に一度だけ読む目的でルールを無効化
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(JSON.parse(stored));
    } catch {
      router.replace("/booking");
    }
  }, [router]);

  if (!data) {
    return <div className="text-center text-white/50">読み込み中...</div>;
  }

  const selectedPlan = plans.find((p) => p.id === data.plan);
  const totalPersons = data.numMale + data.numFemale + data.numChild + data.numInfant;

  // 料金計算
  const adultCount = data.numMale + data.numFemale;
  const estimatedPrice = selectedPlan
    ? selectedPlan.priceLabel
      ? null // プロポーズプラン等は固定料金表記があるため個別計算しない
      : adultCount * selectedPlan.priceAdult +
        data.numChild * (selectedPlan.priceChild || 0) +
        (data.transferOption && !selectedPlan.hideTransfer ? transferOption.price : 0)
    : null;

  async function handleConfirm() {
    if (!data || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await submitBooking(data);
      sessionStorage.removeItem("bookingData");
      if (result.bookingId) {
        sessionStorage.setItem("lastBookingId", result.bookingId);
      }
      router.push("/complete");
    } catch (err) {
      const message = err instanceof Error ? err.message : "送信に失敗しました。もう一度お試しください。";
      setError(message);
      setSubmitting(false);
    }
  }

  const rows: { label: string; value: string }[] = [
    { label: "撮影希望日", value: data.preferredDate },
    { label: "プラン", value: selectedPlan?.name || data.plan },
    ...(data.transferOption && selectedPlan && !selectedPlan.hideTransfer
      ? [{ label: "送迎オプション", value: `あり（${transferOption.label}）` }]
      : []),
    { label: "お名前（代表者）", value: data.representativeName },
    {
      label: "人数",
      value: [
        data.numMale > 0 ? `男性${data.numMale}名` : "",
        data.numFemale > 0 ? `女性${data.numFemale}名` : "",
        data.numChild > 0 ? `子供${data.numChild}名` : "",
        data.numInfant > 0 ? `幼児${data.numInfant}名` : "",
      ]
        .filter(Boolean)
        .join("、") + `（計${totalPersons}名）`,
    },
    { label: "携帯番号", value: data.phone },
    { label: "宿泊施設", value: data.accommodation },
    { label: "滞在期間", value: `${data.stayFrom} 〜 ${data.stayTo}` },
    ...(data.alternativeDate
      ? [{ label: "振替希望日", value: data.alternativeDate }]
      : []),
    ...(data.instagram
      ? [{ label: "Instagram", value: data.instagram }]
      : []),
    ...(selectedPlan?.priceLabel
      ? [{ label: "料金", value: selectedPlan.priceLabel }]
      : estimatedPrice !== null
      ? [{ label: "料金（税込目安）", value: `¥${estimatedPrice.toLocaleString()}` }]
      : []),
  ];

  return (
    <div>
      <h1 className="mb-6 text-center text-xl font-bold text-white">
        予約内容の確認
      </h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <dl className="space-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-xs text-white/50">{row.label}</dt>
              <dd className="text-white">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <button
        onClick={handleConfirm}
        disabled={submitting}
        className="w-full rounded-lg bg-[#c9a84c] py-4 text-base font-bold text-[#0a1628] transition hover:bg-[#d4b85e] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "送信中..." : "予約を確定する"}
      </button>

      <button
        onClick={() => router.back()}
        disabled={submitting}
        className="mt-4 w-full py-3 text-center text-sm text-white/50 hover:text-white/70 disabled:opacity-50"
      >
        戻って修正する
      </button>
    </div>
  );
}
