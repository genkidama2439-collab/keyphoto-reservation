"use client";

import liff from "@line/liff";

let liffInitPromise: Promise<boolean> | null = null;

export type LiffProfile = {
  userId: string;
  displayName: string;
};

/**
 * LIFFを初期化する。複数回呼ばれても1回だけ実行される。
 * 成功時にtrue、失敗時にfalseを返す。
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
      console.log("[liff] init OK, inClient=", liff.isInClient(), "loggedIn=", liff.isLoggedIn());
      return true;
    } catch (err) {
      console.warn("[liff] init failed:", err);
      liffInitPromise = null; // 次回リトライ可能に
      return false;
    }
  })();

  return liffInitPromise;
}

/**
 * LIFFを初期化してプロフィールを取得する。
 * LINE内ブラウザで未ログインなら自動ログイン（ページリロードを伴う）。
 * 外部ブラウザで未ログインならnullを返す。
 */
export async function initLiffAndGetProfile(): Promise<LiffProfile | null> {
  const ok = await initLiff();
  if (!ok) return null;

  // LINE内ブラウザで未ログインなら自動ログイン（リダイレクト）
  if (!liff.isLoggedIn()) {
    if (liff.isInClient()) {
      // 現在のURLをredirectUriに指定して戻ってくるようにする
      liff.login({ redirectUri: window.location.href });
    }
    return null;
  }

  try {
    const profile = await liff.getProfile();
    console.log("[liff] profile:", profile.userId, profile.displayName);
    return {
      userId: profile.userId,
      displayName: profile.displayName,
    };
  } catch (err) {
    console.warn("[liff] getProfile failed:", err);
    return null;
  }
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
