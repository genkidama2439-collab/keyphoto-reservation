"use client";

import { useState, useEffect, type FormEventHandler } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { plans, transferOption } from "@/data/plans";
import { BookingFormData } from "@/types";
import { initLiffAndGetProfile } from "@/lib/liff";

function getToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  const today = getToday();

  useEffect(() => {
    initLiffAndGetProfile().then((profile) => {
      if (profile) {
        setLineUserId(profile.userId);
        setLineDisplayName(profile.displayName);
      }
    });
  }, []);

  // sessionStorage から復元（確認画面から「戻って修正する」で戻ってきた場合）
  // sessionStorage はブラウザ外部ストアなので、マウント時に一度だけ読み込む
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("bookingData");
      if (!stored) return;
      const saved = JSON.parse(stored) as Partial<BookingFormData>;

      // URLで別プランが指定されているなら、古いsessionStorageは破棄（別プランの新規予約とみなす）
      if (preselectedPlan && saved.plan && saved.plan !== preselectedPlan) {
        sessionStorage.removeItem("bookingData");
        return;
      }

      if (saved.preferredDate) setPreferredDate(saved.preferredDate);
      if (saved.plan) setPlan(saved.plan);
      if (typeof saved.transferOption === "boolean") setTransferOptionChecked(saved.transferOption);
      if (saved.representativeName) setRepresentativeName(saved.representativeName);
      if (typeof saved.numMale === "number") setNumMale(saved.numMale);
      if (typeof saved.numFemale === "number") setNumFemale(saved.numFemale);
      if (typeof saved.numChild === "number") setNumChild(saved.numChild);
      if (typeof saved.numInfant === "number") setNumInfant(saved.numInfant);
      if (saved.phone) setPhone(saved.phone);
      if (saved.accommodation) setAccommodation(saved.accommodation);
      if (saved.stayFrom) setStayFrom(saved.stayFrom);
      if (saved.stayTo) setStayTo(saved.stayTo);
      if (saved.alternativeDate) setAlternativeDate(saved.alternativeDate);
      if (saved.instagram) setInstagram(saved.instagram);
    } catch {
      // 壊れたデータは無視
    }
  }, [preselectedPlan]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function validate(): string[] {
    const errs: string[] = [];
    if (!preferredDate) errs.push("撮影希望日を選択してください");
    else if (preferredDate < today) errs.push("撮影希望日は本日以降を選択してください");
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

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
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
  };

  const inputClass =
    "w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]";
  const labelClass = "mb-1 block text-sm font-medium text-white/80";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {lineDisplayName && (
        <div className="rounded-lg border border-[#c9a84c]/30 bg-[#c9a84c]/5 p-3 text-sm text-[#c9a84c]">
          LINE: {lineDisplayName} 様として予約します
        </div>
      )}

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
          min={today}
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
                inputMode="numeric"
                min={0}
                value={value === 0 ? "" : value}
                placeholder="0"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    setter(0);
                    return;
                  }
                  const n = parseInt(v, 10);
                  setter(Number.isNaN(n) ? 0 : Math.max(0, n));
                }}
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
          min={stayFrom || today}
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
