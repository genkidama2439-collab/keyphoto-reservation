"use client";

import liff from "@line/liff";

let liffInitialized = false;
let liffInitError: string | null = null;

export async function initLiff(): Promise<void> {
  if (liffInitialized || liffInitError) return;

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) {
    liffInitError = "NEXT_PUBLIC_LIFF_ID is not set";
    console.warn(liffInitError);
    return;
  }

  try {
    await liff.init({ liffId });
    liffInitialized = true;

    // LINE内ブラウザの場合のみ自動ログイン
    // 外部ブラウザではフォームが使えなくなるのでログイン強制しない
    if (liff.isInClient() && !liff.isLoggedIn()) {
      liff.login();
    }
  } catch (err) {
    liffInitError = err instanceof Error ? err.message : "LIFF init failed";
    console.warn("LIFF init failed:", liffInitError);
  }
}

export async function getLiffProfile() {
  if (!liffInitialized) return null;
  if (!liff.isLoggedIn()) return null;
  try {
    const profile = await liff.getProfile();
    return {
      userId: profile.userId,
      displayName: profile.displayName,
    };
  } catch {
    return null;
  }
}

export function closeLiff() {
  if (liffInitialized && liff.isInClient()) {
    liff.closeWindow();
  }
}
