"use client";

import liff from "@line/liff";

let liffInitPromise: Promise<boolean> | null = null;

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

function pushLog(status: LiffStatus, line: string) {
  const timestamp = new Date().toLocaleTimeString("ja-JP");
  status.logs.push(`[${timestamp}] ${line}`);
  console.log("[liff]", line);
}

/**
 * LIFFを初期化する。複数回呼ばれても1回だけ実行される。
 */
export function initLiff(): Promise<boolean> {
  if (liffInitPromise) return liffInitPromise;

  liffInitPromise = (async () => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      console.warn("[liff] NEXT_PUBLIC_LIFF_ID is not set");
      return false;
    }

    try {
      await liff.init({ liffId });
      return true;
    } catch (err) {
      console.warn("[liff] init failed:", err);
      liffInitPromise = null;
      return false;
    }
  })();

  return liffInitPromise;
}

/**
 * LIFFを初期化してプロフィール取得、状態を詳しく返す（デバッグパネル用）。
 */
export async function initLiffAndGetStatus(): Promise<LiffStatus> {
  const status: LiffStatus = {
    liffIdSet: false,
    initStarted: false,
    initSucceeded: false,
    initError: null,
    isInClient: null,
    isLoggedIn: null,
    profileFetched: false,
    profileError: null,
    profile: null,
    logs: [],
  };

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  status.liffIdSet = !!liffId;
  pushLog(status, `LIFF_ID: ${liffId ? liffId.slice(0, 10) + "..." : "未設定"}`);

  if (!liffId) {
    pushLog(status, "NEXT_PUBLIC_LIFF_ID が設定されていません");
    return status;
  }

  status.initStarted = true;
  pushLog(status, "liff.init() を実行中...");
  try {
    await liff.init({ liffId });
    status.initSucceeded = true;
    pushLog(status, "liff.init() 成功");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    status.initError = msg;
    pushLog(status, `liff.init() 失敗: ${msg}`);
    return status;
  }

  try {
    status.isInClient = liff.isInClient();
    status.isLoggedIn = liff.isLoggedIn();
    pushLog(status, `isInClient=${status.isInClient}, isLoggedIn=${status.isLoggedIn}`);
  } catch (err) {
    pushLog(status, `status check failed: ${err}`);
  }

  if (!status.isLoggedIn) {
    pushLog(status, "未ログイン状態");
    if (status.isInClient) {
      pushLog(status, "LINE内ブラウザなので liff.login() でリダイレクトします");
      try {
        liff.login({ redirectUri: window.location.href });
      } catch (err) {
        pushLog(status, `liff.login() 失敗: ${err}`);
      }
    } else {
      pushLog(status, "外部ブラウザのためログインはスキップ");
    }
    return status;
  }

  pushLog(status, "liff.getProfile() を実行中...");
  try {
    const profile = await liff.getProfile();
    status.profileFetched = true;
    status.profile = {
      userId: profile.userId,
      displayName: profile.displayName,
    };
    pushLog(status, `プロフィール取得成功: ${profile.displayName}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    status.profileError = msg;
    pushLog(status, `getProfile 失敗: ${msg}`);
  }

  return status;
}

export async function closeLiff(): Promise<boolean> {
  try {
    const ok = await initLiff();
    if (ok && liff.isInClient()) {
      liff.closeWindow();
      return true;
    }
  } catch (err) {
    console.warn("closeLiff failed:", err);
  }
  return false;
}
