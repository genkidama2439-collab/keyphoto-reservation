# KeyPhoto Reservation System

## プロジェクト概要

宮古島の星空フォトツアー「KeyPhoto」のLINE予約システム。
LINEアプリ内で予約が完結する仕組みを構築する。

## 技術スタック

- フロントエンド: Next.js (App Router) + TypeScript + Tailwind CSS
- LINE連携: LIFF SDK (LINE Front-end Framework)
- バックエンド: Google Apps Script (GAS)
- データベース: Google Spreadsheet
- カレンダー連携: Google Calendar
- 通知: LINE Messaging API
- ホスティング: Vercel

## アーキテクチャ

```
LINE（お客様）
  ↓ リッチメニュータップ
LIFF（Next.js on Vercel）
  ↓ フォーム送信
Google Apps Script (API)
  ↓
Google Spreadsheet（予約データ保存）
Google Calendar（スケジュール反映）
  ↓
LINE Messaging API（お客様へ確認通知 + オーナーへ通知）
```

## ディレクトリ構成

```
keyphoto-reservation/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # トップ（プラン一覧）
│   │   ├── plan/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # プラン詳細
│   │   ├── booking/
│   │   │   └── page.tsx        # 予約フォーム
│   │   ├── confirm/
│   │   │   └── page.tsx        # 予約確認画面
│   │   └── complete/
│   │       └── page.tsx        # 予約完了画面
│   ├── components/
│   │   ├── PlanCard.tsx
│   │   ├── BookingForm.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── lib/
│   │   ├── liff.ts
│   │   └── api.ts
│   ├── data/
│   │   └── plans.ts            # プランデータ定義
│   └── types/
│       └── index.ts
├── public/
│   └── images/
├── gas/
│   └── Code.gs
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 環境変数

```
NEXT_PUBLIC_LIFF_ID=
NEXT_PUBLIC_GAS_URL=
NEXT_PUBLIC_SITE_NAME=KeyPhoto
```

## プラン情報（正式データ）

### 1. カジュアルプラン
- タグ: お得に体験
- キャッチ: サクッと撮影したい人向け!
- 料金: 大人 ¥6,500/人、子供(15〜0才) ¥3,000/人
- 時間: 15分前後
- 含まれるもの: 8枚データ

### 2. スタンダードプラン
- タグ: プロが撮る特別価格
- キャッチ: 本格撮影30分撮り放題
- 料金: 大人 ¥9,000/人、子供(15〜0才) ¥5,000/人
- 時間: 30分
- 含まれるもの: 撮影データ全て

### 3. クリエイティブプラン
- タグ: オリジナルで個性的な撮影
- キャッチ: 電飾3枚＋通常カット
- 料金: 大人 ¥14,000/人、子供(15〜0才) ¥6,000/人
- 時間: 30分
- 含まれるもの: 撮影データ全て

### 4. ロケーションプラン
- タグ: 撮影場所にこだわる
- キャッチ: どうしても撮りたい場所がある方に! 白い砂浜・緑
- 料金: 大人 ¥20,000/人
- 時間: 30分
- 含まれるもの: 撮影データ全て

### 5. プレミアムプラン
- タグ: ラグジュアリー
- キャッチ: 星と光で2人のメモリアル
- 料金: 大人 ¥25,000/人
- 時間: 40分
- 含まれるもの: 撮影データ全て、送迎付き(2人まで)、電飾撮影5枚

### 6. プロポーズプラン
- タグ: 一生の思い出を
- 料金: 1組 ¥100,000
- 時間: 40分
- 含まれるもの: 撮影データ全て、サプライズ演出、指輪預かり対応、電飾使用
- 注意: 花束はお客様準備

### オプション: 送迎
- 料金: ¥5,000（3名まで）
- 注意: 4名からは要相談

## 予約フォームで収集する情報

| # | 項目 | フィールド名 | 種別 | 備考 |
|---|------|-------------|------|------|
| 自動 | LINE ユーザーID | lineUserId | hidden | LIFF自動取得 |
| 自動 | LINE 表示名 | lineDisplayName | hidden | LIFF自動取得 |
| 1 | 撮影希望日 | preferredDate | date picker | 必須 |
| 2 | プラン | plan | select | 必須・上記6プランから選択 |
| - | 送迎オプション | transferOption | checkbox | 任意・¥5,000 |
| 3 | お名前（代表者） | representativeName | text | 必須 |
| 4 | 人数 - 男性 | numMale | number | 0以上 |
| 4 | 人数 - 女性 | numFemale | number | 0以上 |
| 4 | 人数 - 子供(4〜15歳) | numChild | number | 0以上 |
| 4 | 人数 - 幼児(3歳以下) | numInfant | number | 0以上 |
| 5 | 携帯番号 | phone | tel | 必須 |
| 6 | 宿泊施設 | accommodation | text | 必須 |
| 7 | 滞在期間 - 開始 | stayFrom | date | 必須 |
| 7 | 滞在期間 - 終了 | stayTo | date | 必須 |
| 8 | 振替希望日 | alternativeDate | date picker | 任意・天候不良時の代替日 |
| - | Instagram | instagram | text | 任意・ストーリータグ付け用 |

## バリデーションルール

- 合計人数（男性+女性+子供+幼児）が1人以上
- 撮影希望日は当日以降
- 振替希望日は撮影希望日と異なる日付
- 滞在期間の開始 <= 終了
- 撮影希望日・振替希望日は滞在期間内
- プロポーズプランの場合、送迎オプションは非表示（プランに含まれないため）
- 送迎オプション選択時、人数3名超は「要相談」表示

## デザイン方針

- ダークテーマ（星空イメージ）
- カラー: ネイビー(#0a1628) + ゴールド(#c9a84c) + ホワイト
- モバイルファースト（LINE内ブラウザ前提）
- 日本語UI

## 開発コマンド

```bash
npm run dev
npm run build
npm run lint
```

## 注意事項

- LIFF内で動作するため、すべてのページでLIFF初期化が必要
- LIFFのisReady状態を確認してからユーザー情報取得
- GASへのPOSTはCORS対応（GASのdoPost内でレスポンスヘッダー設定）
- 予約の二重送信防止（GAS側でLockService使用）
