"use client";

import { useState } from "react";
import type { LiffStatus } from "@/lib/liff";

export default function LiffDebugPanel({ status }: { status: LiffStatus | null }) {
  const [open, setOpen] = useState(true);

  if (!status) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/60">
        LIFF: 初期化中...
      </div>
    );
  }

  const overallStatus = status.profile
    ? "success"
    : status.initError || status.profileError
    ? "error"
    : "warn";

  const statusColor =
    overallStatus === "success"
      ? "border-green-500/50 bg-green-500/10 text-green-300"
      : overallStatus === "error"
      ? "border-red-500/50 bg-red-500/10 text-red-300"
      : "border-yellow-500/50 bg-yellow-500/10 text-yellow-200";

  const headline = status.profile
    ? `✅ LINE: ${status.profile.displayName} 様`
    : status.initError
    ? `❌ LIFF初期化エラー`
    : status.profileError
    ? `❌ プロフィール取得エラー`
    : status.isInClient === false
    ? "⚠️ 外部ブラウザ（LINE内で開いてください）"
    : status.isLoggedIn === false
    ? "⚠️ LINE未ログイン"
    : "⏳ 初期化中...";

  return (
    <div className={`rounded-lg border p-3 text-xs ${statusColor}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left font-semibold"
      >
        <span>{headline}</span>
        <span className="ml-2 opacity-60">{open ? "▼ 詳細" : "▶ 詳細"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-1 border-t border-white/10 pt-3 font-mono text-[10px] leading-relaxed opacity-90">
          <div>liffIdSet: <b>{String(status.liffIdSet)}</b></div>
          <div>initStarted: <b>{String(status.initStarted)}</b></div>
          <div>initSucceeded: <b>{String(status.initSucceeded)}</b></div>
          {status.initError && <div>initError: <b>{status.initError}</b></div>}
          <div>isInClient: <b>{String(status.isInClient)}</b></div>
          <div>isLoggedIn: <b>{String(status.isLoggedIn)}</b></div>
          <div>profileFetched: <b>{String(status.profileFetched)}</b></div>
          {status.profileError && <div>profileError: <b>{status.profileError}</b></div>}
          {status.profile && (
            <>
              <div>userId: <b className="break-all">{status.profile.userId}</b></div>
              <div>displayName: <b>{status.profile.displayName}</b></div>
            </>
          )}
          <div className="mt-2 border-t border-white/10 pt-2">
            <div className="mb-1 opacity-70">--- ログ ---</div>
            {status.logs.map((line, i) => (
              <div key={i} className="break-all">{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
