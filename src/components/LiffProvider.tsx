"use client";

import { useEffect } from "react";
import { initLiff } from "@/lib/liff";

/**
 * ルートレイアウトに差し込み、最初のページロード時に
 * 一度だけ liff.init() を実行するためのプロバイダー。
 * liff.init() は URL に liff.state パラメータがあるときに呼ばないと
 * "Unable to load client features" エラーになるため、
 * クライアントサイドナビゲーション後の実行では遅い。
 */
export default function LiffProvider() {
  useEffect(() => {
    initLiff();
  }, []);

  return null;
}
