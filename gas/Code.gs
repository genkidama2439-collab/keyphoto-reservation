/**
 * KeyPhoto 予約管理 - Google Apps Script
 *
 * 機能:
 * 1. フォームからのPOSTで予約データをシートに自動保存
 * 2. シート構造（ヘッダー・書式・プルダウン）を自動作成
 * 3. カスタムメニューからステータス変更 → LINE通知
 * 4. Googleカレンダー連携
 *
 * スクリプトプロパティ:
 * - SPREADSHEET_ID: スプレッドシートID
 * - CALENDAR_ID: GoogleカレンダーID
 * - LINE_CHANNEL_ACCESS_TOKEN: LINE Messaging APIトークン
 * - OWNER_LINE_USER_ID: オーナーのLINEユーザーID
 */

const PROPS = PropertiesService.getScriptProperties();

// ─── ヘッダー定義（予約フォームと完全一致） ─────────────────
const HEADERS = [
  "予約ID",        // A: 自動採番
  "受付日時",      // B: 自動
  "ステータス",    // C: 新規/確定/完了/キャンセル
  "LINE ID",       // D: hidden
  "LINE名",        // E: hidden
  "撮影希望日",    // F
  "プラン",        // G
  "送迎",          // H
  "代表者名",      // I
  "男性",          // J
  "女性",          // K
  "子供",          // L
  "幼児",          // M
  "合計人数",      // N
  "携帯番号",      // O
  "宿泊施設",      // P
  "滞在開始",      // Q
  "滞在終了",      // R
  "振替希望日",    // S
  "Instagram",     // T
  "メモ",          // U: オーナー用メモ欄
];

const STATUS_OPTIONS = ["新規", "確定", "完了", "キャンセル"];
const COL = {};
HEADERS.forEach((h, i) => { COL[h] = i + 1; });

// ─── メニュー ─────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📸 KeyPhoto")
    .addItem("✅ 選択行を「確定」にしてLINE通知", "confirmBooking")
    .addItem("🎉 選択行を「完了」にする", "completeBooking")
    .addItem("❌ 選択行を「キャンセル」にしてLINE通知", "cancelBooking")
    .addSeparator()
    .addItem("🔄 シート初期化（ヘッダー再作成）", "initSheet")
    .addToUi();
}

// ─── シート初期化 ──────────────────────────────────────────
function initSheet() {
  const ss = SpreadsheetApp.openById(PROPS.getProperty("SPREADSHEET_ID"));
  let sheet = ss.getSheetByName("予約");
  if (!sheet) {
    sheet = ss.insertSheet("予約");
  }
  setupSheetStructure(sheet);
  SpreadsheetApp.getUi().alert("シートを初期化しました");
}

function setupSheetStructure(sheet) {
  // ヘッダー行
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  } else {
    const range = sheet.getRange(1, 1, 1, HEADERS.length);
    range.setValues([HEADERS]);
  }

  // ヘッダー書式
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange
    .setBackground("#0a1628")
    .setFontColor("#c9a84c")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  // 列幅
  sheet.setColumnWidth(COL["予約ID"], 80);
  sheet.setColumnWidth(COL["受付日時"], 150);
  sheet.setColumnWidth(COL["ステータス"], 100);
  sheet.setColumnWidth(COL["LINE ID"], 120);
  sheet.setColumnWidth(COL["LINE名"], 120);
  sheet.setColumnWidth(COL["撮影希望日"], 120);
  sheet.setColumnWidth(COL["プラン"], 160);
  sheet.setColumnWidth(COL["代表者名"], 140);
  sheet.setColumnWidth(COL["携帯番号"], 130);
  sheet.setColumnWidth(COL["宿泊施設"], 160);
  sheet.setColumnWidth(COL["メモ"], 200);

  // ステータス列にプルダウン設定（2行目〜1000行目）
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, COL["ステータス"], 999).setDataValidation(statusRule);

  // ステータス列の条件付き書式
  const rules = sheet.getConditionalFormatRules();
  const statusRange = sheet.getRange("C2:C1000");
  const newRules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("新規").setBackground("#fff3cd").setFontColor("#856404").setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("確定").setBackground("#d4edda").setFontColor("#155724").setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("完了").setBackground("#cce5ff").setFontColor("#004085").setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("キャンセル").setBackground("#f8d7da").setFontColor("#721c24").setRanges([statusRange]).build(),
  ];
  sheet.setConditionalFormatRules([...rules, ...newRules]);
}

function ensureSheet() {
  const ss = SpreadsheetApp.openById(PROPS.getProperty("SPREADSHEET_ID"));
  let sheet = ss.getSheetByName("予約");
  if (!sheet) {
    sheet = ss.insertSheet("予約");
    setupSheetStructure(sheet);
  } else if (sheet.getLastRow() === 0) {
    setupSheetStructure(sheet);
  }
  return sheet;
}

// ─── 予約ID生成 ────────────────────────────────────────────
function generateBookingId() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = ("0" + (now.getMonth() + 1)).slice(-2);
  const d = ("0" + now.getDate()).slice(-2);
  const rand = ("000" + Math.floor(Math.random() * 1000)).slice(-3);
  return "KP" + y + m + d + "-" + rand;
}

// ─── POST受信 ──────────────────────────────────────────────
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lockErr) {
    return jsonResponse({ success: false, message: "サーバーが混雑しています" });
  }

  try {
    const data = JSON.parse(e.postData.contents);
    const bookingId = saveToSpreadsheet(data);
    createCalendarEvent(data, bookingId);
    sendNewBookingNotification(data, bookingId);
    return jsonResponse({ success: true, message: "予約を受け付けました", bookingId });
  } catch (err) {
    return jsonResponse({ success: false, message: err.message });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return jsonResponse({ status: "ok" });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// ─── スプレッドシート保存 ──────────────────────────────────
function saveToSpreadsheet(data) {
  const sheet = ensureSheet();
  const bookingId = generateBookingId();

  const totalPersons =
    (data.numMale || 0) +
    (data.numFemale || 0) +
    (data.numChild || 0) +
    (data.numInfant || 0);

  const row = [
    bookingId,
    new Date(),
    "新規",
    data.lineUserId || "",
    data.lineDisplayName || "",
    data.preferredDate,
    data.planName || data.plan,
    data.transferOption ? "あり" : "なし",
    data.representativeName,
    data.numMale || 0,
    data.numFemale || 0,
    data.numChild || 0,
    data.numInfant || 0,
    totalPersons,
    data.phone,
    data.accommodation,
    data.stayFrom,
    data.stayTo,
    data.alternativeDate || "",
    data.instagram || "",
    "", // メモ
  ];

  sheet.appendRow(row);
  return bookingId;
}

// ─── カレンダー ────────────────────────────────────────────
function createCalendarEvent(data, bookingId) {
  const calendarId = PROPS.getProperty("CALENDAR_ID");
  if (!calendarId) return;

  const calendar = CalendarApp.getCalendarById(calendarId);
  if (!calendar) return;

  const date = new Date(data.preferredDate);
  const totalPersons =
    (data.numMale || 0) +
    (data.numFemale || 0) +
    (data.numChild || 0) +
    (data.numInfant || 0);

  const title = `[${bookingId}] ${data.representativeName}様 - ${data.plan}`;
  const description = [
    `予約ID: ${bookingId}`,
    `代表者: ${data.representativeName}`,
    `人数: ${totalPersons}名`,
    `携帯: ${data.phone}`,
    `宿泊: ${data.accommodation}`,
    data.transferOption ? "送迎: あり" : "",
    data.instagram ? `Instagram: ${data.instagram}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  calendar.createAllDayEvent(title, date, { description });
}

// ─── LINE通知（新規予約時） ────────────────────────────────
function sendNewBookingNotification(data, bookingId) {
  const token = PROPS.getProperty("LINE_CHANNEL_ACCESS_TOKEN");
  if (!token) return;

  const totalPersons =
    (data.numMale || 0) +
    (data.numFemale || 0) +
    (data.numChild || 0) +
    (data.numInfant || 0);

  // お客様への通知
  if (data.lineUserId) {
    const customerMsg =
      `🌟 ご予約ありがとうございます！\n\n` +
      `予約ID: ${bookingId}\n` +
      `📅 撮影日: ${data.preferredDate}\n` +
      `📋 プラン: ${data.planName || data.plan}\n` +
      `👤 代表者: ${data.representativeName}\n` +
      `👥 人数: ${totalPersons}名\n` +
      (data.alternativeDate ? `🔄 振替希望日: ${data.alternativeDate}\n` : "") +
      `\n確定次第、改めてLINEでご連絡いたします。`;
    pushMessage(token, data.lineUserId, customerMsg);
  }

  // オーナーへの通知
  const ownerId = PROPS.getProperty("OWNER_LINE_USER_ID");
  if (ownerId) {
    const ownerMsg =
      `📸 新規予約 [${bookingId}]\n\n` +
      `日付: ${data.preferredDate}\n` +
      `プラン: ${data.planName || data.plan}\n` +
      `代表者: ${data.representativeName}\n` +
      `人数: ${totalPersons}名\n` +
      `電話: ${data.phone}\n` +
      `宿泊: ${data.accommodation}\n` +
      `滞在: ${data.stayFrom} 〜 ${data.stayTo}\n` +
      (data.transferOption ? "送迎: あり\n" : "") +
      (data.alternativeDate ? `振替: ${data.alternativeDate}\n` : "") +
      (data.instagram ? `IG: ${data.instagram}` : "");
    pushMessage(token, ownerId, ownerMsg);
  }
}

// ─── ステータス変更（メニューから実行） ────────────────────
function confirmBooking() {
  changeStatus("確定");
}

function completeBooking() {
  changeStatus("完了");
}

function cancelBooking() {
  changeStatus("キャンセル");
}

function changeStatus(newStatus) {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  const row = sheet.getActiveRange().getRow();

  if (row <= 1) {
    ui.alert("ヘッダー行は選択できません。予約行を選択してください。");
    return;
  }

  const bookingId = sheet.getRange(row, COL["予約ID"]).getValue();
  const lineUserId = sheet.getRange(row, COL["LINE ID"]).getValue();
  const name = sheet.getRange(row, COL["代表者名"]).getValue();
  const date = sheet.getRange(row, COL["撮影希望日"]).getValue();
  const planName = sheet.getRange(row, COL["プラン"]).getValue();
  const currentStatus = sheet.getRange(row, COL["ステータス"]).getValue();

  if (!bookingId) {
    ui.alert("予約データが見つかりません。");
    return;
  }

  const result = ui.alert(
    `ステータス変更`,
    `${name}様 (${bookingId}) を\n「${currentStatus}」→「${newStatus}」に変更しますか？`,
    ui.ButtonSet.YES_NO
  );

  if (result !== ui.Button.YES) return;

  // ステータス更新
  sheet.getRange(row, COL["ステータス"]).setValue(newStatus);

  // LINE通知
  const token = PROPS.getProperty("LINE_CHANNEL_ACCESS_TOKEN");
  if (!token || !lineUserId) {
    ui.alert(`ステータスを「${newStatus}」に変更しました。\n（LINE通知: スキップ）`);
    return;
  }

  let message = "";
  if (newStatus === "確定") {
    message =
      `✅ ご予約が確定しました！\n\n` +
      `予約ID: ${bookingId}\n` +
      `📅 撮影日: ${date}\n` +
      `📋 プラン: ${planName}\n` +
      `👤 ${name}様\n\n` +
      `当日お会いできることを楽しみにしております！\n` +
      `ご不明点がございましたらお気軽にメッセージください。`;
  } else if (newStatus === "キャンセル") {
    message =
      `📩 予約キャンセルのお知らせ\n\n` +
      `予約ID: ${bookingId}\n` +
      `📅 撮影日: ${date}\n` +
      `📋 プラン: ${planName}\n\n` +
      `ご予約をキャンセルいたしました。\n` +
      `またのご利用をお待ちしております。`;
  }

  if (message) {
    try {
      pushMessage(token, lineUserId, message);
      ui.alert(`ステータスを「${newStatus}」に変更し、LINE通知を送信しました。`);
    } catch (err) {
      ui.alert(`ステータスは変更しましたが、LINE通知に失敗しました。\n${err.message}`);
    }
  } else {
    ui.alert(`ステータスを「${newStatus}」に変更しました。`);
  }
}

// ─── LINE送信共通 ──────────────────────────────────────────
function pushMessage(token, userId, text) {
  UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + token },
    payload: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text }],
    }),
  });
}
