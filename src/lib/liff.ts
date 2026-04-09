"use client";

import liff from "@line/liff";

let liffInitialized = false;

export async function initLiff(): Promise<void> {
  if (liffInitialized) return;

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) {
    console.warn("NEXT_PUBLIC_LIFF_ID is not set");
    return;
  }

  await liff.init({ liffId });
  liffInitialized = true;

  if (!liff.isLoggedIn()) {
    liff.login();
  }
}

export async function getLiffProfile() {
  if (!liffInitialized) return null;
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
