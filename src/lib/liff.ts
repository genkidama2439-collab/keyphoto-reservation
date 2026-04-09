"use client";

import liff from "@line/liff";

// 初期化の結果を共有するための状態
let liffInitPromise: Promise<void> | null = null;
let liffInitSucceeded = false;
let liffInitError: string | null = null;
const liffInitLogs: string[] = [];

export type LiffProfile = {
  userId: string;
  displayName: string;
};

export type LiffStatus = {
  liffIdSet: boolean;
  initStarted: boolean;
  initSucceeded: boolean;
  initError: string | null;
  isInClient: boolean | null;
  isLoggedIn: boolean | null;
  profileFetched: boolean;
  profileError: string | null;
  profile: LiffProfile | null;
  logs: string[];
};

function logGlobal(line: string) {
  const timestamp = new Date().toLocaleTimeString("ja-JP");
  const formatted = `[${timestamp}] ${line}`;
  liffInitLogs.push(formatted);
  console.log("[liff]", line);
}

/**
 * LIFFを初期化する。最初に呼ばれた一回だけ実行される。
 * ルートレイアウトから早めに呼ぶことで、URLに liff.state が付いている
 * 初期ロード段階で init を完了させる。
 */
export function initLiff(): Promise<void> {
  if (liffInitPromise) return liffInitPromise;

  liffInitPromise = (async () => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    logGlobal(`LIFF_ID: ${liffId ? liffId.slice(0, 10) + "..." : "未設定"}`);
    if (!liffId) {
      liffInitError = "NEXT_PUBLIC_LIFF_ID is not set";
      logGlobal("NEXT_PUBLIC_LIFF_ID が設定されていません");
      return;
    }

    logGlobal(`liff.init() を実行中... (url=${window.location.href})`);
    try {
      await liff.init({ liffId });
      liffInitSucceeded = true;
      logGlobal("liff.init() 成功");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      liffInitError = msg;
      logGlobal(`liff.init() 失敗: ${msg}`);

      // 非LIFF URLからの直接アクセス時は、LIFF URLへ自動リダイレクト
      if (
        typeof window !== "undefined" &&
        msg.toLowerCase().includes("unable to load client features")
      ) {
        const redirectFlag = "liffRedirectAttempted";
        const attempted = sessionStorage.getItem(redirectFlag);
        if (!attempted) {
          sessionStorage.setItem(redirectFlag, "1");
          const path = window.location.pathname + window.location.search;
          const target = `https://liff.line.me/${liffId}${path}`;
          logGlobal(`LIFF URL へリダイレクト: ${target}`);
          window.location.replace(target);
          return;
        }
        logGlobal("LIFFリダイレクト済みだが再失敗");
      }
      // 失敗しても再挑戦できるようpromiseを残す（状態は保持）
    }

    // 成功時はリダイレクトフラグをクリア
    if (liffInitSucceeded && typeof window !== "undefined") {
      sessionStorage.removeItem("liffRedirectAttempted");
    }
  })();

  return liffInitPromise;
}

/**
 * 初期化状態とプロフィールを取得してデバッグパネル向けに返す。
 * initLiff() の結果を再利用するので、init は1回しか実行されない。
 */
export async function initLiffAndGetStatus(): Promise<LiffStatus> {
  // 既に開始済みのルートレベル init を待つ
  await initLiff();

  const status: LiffStatus = {
    liffIdSet: !!process.env.NEXT_PUBLIC_LIFF_ID,
    initStarted: true,
    initSucceeded: liffInitSucceeded,
    initError: liffInitError,
    isInClient: null,
    isLoggedIn: null,
    profileFetched: false,
    profileError: null,
    profile: null,
    logs: [...liffInitLogs],
  };

  if (!liffInitSucceeded) {
    return status;
  }

  try {
    status.isInClient = liff.isInClient();
    status.isLoggedIn = liff.isLoggedIn();
    status.logs.push(`[-] isInClient=${status.isInClient}, isLoggedIn=${status.isLoggedIn}`);
  } catch (err) {
    status.logs.push(`[-] status check failed: ${err}`);
  }

  if (!status.isLoggedIn) {
    status.logs.push("[-] 未ログイン状態（プロフィール取得スキップ）");
    return status;
  }

  status.logs.push("[-] liff.getProfile() を実行中...");
  try {
    const profile = await liff.getProfile();
    status.profileFetched = true;
    status.profile = {
      userId: profile.userId,
      displayName: profile.displayName,
    };
    status.logs.push(`[-] プロフィール取得成功: ${profile.displayName}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    status.profileError = msg;
    status.logs.push(`[-] getProfile 失敗: ${msg}`);
  }

  return status;
}

export async function closeLiff(): Promise<boolean> {
  try {
    await initLiff();
    if (liffInitSucceeded && liff.isInClient()) {
      liff.closeWindow();
      return true;
    }
  } catch (err) {
    console.warn("closeLiff failed:", err);
  }
  return false;
}
