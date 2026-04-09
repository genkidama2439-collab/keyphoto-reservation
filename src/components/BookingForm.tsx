"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { plans, transferOption } from "@/data/plans";
import { BookingFormData } from "@/types";
import { initLiff, getLiffProfile } from "@/lib/liff";

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get("plan") || "";

  const [lineUserId, setLineUserId] = useState("");
  const [lineDisplayName, setLineDisplayName] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [plan, setPlan] = useState(preselectedPlan);
  const [transferOptionChecked, setTransferOptionChecked] = useState(false);
  const [representativeName, setRepresentativeName] = useState("");
  const [numMale, setNumMale] = useState(0);
  const [numFemale, setNumFemale] = useState(0);
  const [numChild, setNumChild] = useState(0);
  const [numInfant, setNumInfant] = useState(0);
  const [phone, setPhone] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [stayFrom, setStayFrom] = useState("");
  const [stayTo, setStayTo] = useState("");
  const [alternativeDate, setAlternativeDate] = useState("");
  const [instagram, setInstagram] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const selectedPlan = plans.find((p) => p.id === plan);
  const totalPersons = numMale + numFemale + numChild + numInfant;
  const tomorrow = getTomorrow();

  useEffect(() => {
    initLiff().then(async () => {
      const profile = await getLiffProfile();
      if (profile) {
        setLineUserId(profile.userId);
        setLineDisplayName(profile.displayName);
      }
    });
  }, []);

  function validate(): string[] {
    const errs: string[] = [];
    if (!preferredDate) errs.push("撮影希望日を選択してください");
    else if (preferredDate < tomorrow) errs.push("撮影希望日は翌日以降を選択してください");
    if (!plan) errs.push("プランを選択してください");
    if (!representativeName.trim()) errs.push("お名前を入力してください");
    if (totalPersons < 1) errs.push("人数を1名以上入力してください");
    if (!phone.trim()) errs.push("携帯番号を入力してください");
    if (!accommodation.trim()) errs.push("宿泊施設を入力してください");
    if (!stayFrom) errs.push("滞在期間（開始）を選択してください");
    if (!stayTo) errs.push("滞在期間（終了）を選択してください");
    if (stayFrom && stayTo && stayFrom > stayTo) errs.push("滞在期間の開始は終了以前にしてください");
    if (preferredDate && stayFrom && stayTo) {
      if (preferredDate < stayFrom || preferredDate > stayTo)
        errs.push("撮影希望日は滞在期間内で選択してください");
    }
    if (alternativeDate) {
      if (alternativeDate === preferredDate) errs.push("振替希望日は撮影希望日と異なる日付にしてください");
      if (stayFrom && stayTo && (alternativeDate < stayFrom || alternativeDate > stayTo))
        errs.push("振替希望日は滞在期間内で選択してください");
    }
    return errs;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors([]);

    const formData: BookingFormData = {
      lineUserId,
      lineDisplayName,
      preferredDate,
      plan,
      planName: selectedPlan?.name || plan,
      transferOption: transferOptionChecked,
      representativeName,
      numMale,
      numFemale,
      numChild,
      numInfant,
      phone,
      accommodation,
      stayFrom,
      stayTo,
      alternativeDate,
      instagram,
    };

    sessionStorage.setItem("bookingData", JSON.stringify(formData));
    router.push("/confirm");
  }

  const inputClass =
    "w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]";
  const labelClass = "mb-1 block text-sm font-medium text-white/80";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-400">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* 撮影希望日 */}
      <div>
        <label className={labelClass}>
          撮影希望日 <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          min={tomorrow}
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* プラン */}
      <div>
        <label className={labelClass}>
          プラン <span className="text-red-400">*</span>
        </label>
        <select
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value);
            setTransferOptionChecked(false);
          }}
          className={inputClass}
        >
          <option value="">プランを選択</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* 送迎オプション */}
      {selectedPlan && !selectedPlan.hideTransfer && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={transferOptionChecked}
              onChange={(e) => setTransferOptionChecked(e.target.checked)}
              className="h-5 w-5 rounded border-white/20 bg-white/5 text-[#c9a84c] focus:ring-[#c9a84c]"
            />
            <span className="text-sm text-white/80">{transferOption.label}</span>
          </label>
          {transferOptionChecked && totalPersons > transferOption.maxPersons && (
            <p className="mt-2 text-sm text-[#c9a84c]">
              ※ {transferOption.maxPersons}名を超える場合は要相談となります
            </p>
          )}
        </div>
      )}

      {/* お名前 */}
      <div>
        <label className={labelClass}>
          お名前（代表者） <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={representativeName}
          onChange={(e) => setRepresentativeName(e.target.value)}
          placeholder="山田 太郎"
          className={inputClass}
        />
      </div>

      {/* 人数 */}
      <div>
        <p className={labelClass}>人数</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "男性", value: numMale, setter: setNumMale },
            { label: "女性", value: numFemale, setter: setNumFemale },
            { label: "子供(4〜15歳)", value: numChild, setter: setNumChild },
            { label: "幼児(3歳以下)", value: numInfant, setter: setNumInfant },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className="mb-1 block text-xs text-white/60">{label}</label>
              <input
                type="number"
                min={0}
                value={value}
                onChange={(e) => setter(Math.max(0, parseInt(e.target.value) || 0))}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 携帯番号 */}
      <div>
        <label className={labelClass}>
          携帯番号 <span className="text-red-400">*</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="090-1234-5678"
          className={inputClass}
        />
      </div>

      {/* 宿泊施設 */}
      <div>
        <label className={labelClass}>
          宿泊施設 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={accommodation}
          onChange={(e) => setAccommodation(e.target.value)}
          placeholder="ホテル名"
          className={inputClass}
        />
      </div>

      {/* 滞在期間 */}
      <div>
        <p className={labelClass}>
          滞在期間 <span className="text-red-400">*</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-white/60">開始</label>
            <input
              type="date"
              value={stayFrom}
              onChange={(e) => setStayFrom(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">終了</label>
            <input
              type="date"
              value={stayTo}
              onChange={(e) => setStayTo(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* 振替希望日 */}
      <div>
        <label className={labelClass}>振替希望日（天候不良時）</label>
        <input
          type="date"
          min={stayFrom || tomorrow}
          max={stayTo || undefined}
          value={alternativeDate}
          onChange={(e) => setAlternativeDate(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Instagram */}
      <div>
        <label className={labelClass}>Instagram</label>
        <input
          type="text"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="@your_account"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-white/40">ストーリーでタグ付けします</p>
      </div>

      {/* 送信ボタン */}
      <button
        type="submit"
        className="w-full rounded-lg bg-[#c9a84c] py-4 text-base font-bold text-[#0a1628] transition hover:bg-[#d4b85e] active:scale-[0.98]"
      >
        確認画面へ
      </button>
    </form>
  );
}
