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
 * - OWNER_EMAIL: 業者側通知メールアドレス（カンマ区切りで複数可）
 * - EMERGENCY_CONTACT: 緊急連絡先（例: 090-9279-9586（稲田））
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
    if (!data.lineUserId) {
      return jsonResponse({ success: false, message: "LINEユーザー情報が取得できていません。LINE内から予約ページを開き直してください。" });
    }
    // 同一ユーザー・同日・同プランの重複チェック
    const sheet = ensureSheet();
    const existing = sheet.getDataRange().getValues();
    for (var i = 1; i < existing.length; i++) {
      if (existing[i][COL["LINE ID"] - 1] === data.lineUserId &&
          String(existing[i][COL["撮影希望日"] - 1]) === data.preferredDate &&
          existing[i][COL["ステータス"] - 1] !== "キャンセル") {
        return jsonResponse({ success: false, message: "同じ日付の予約が既に存在します。別の日程を選択するか、LINEでお問い合わせください。" });
      }
    }
    const bookingId = saveToSpreadsheet(data);
    createCalendarEvent(data, bookingId);
    sendNewBookingNotification(data, bookingId);
    sendOwnerEmail(data, bookingId);
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

// ─── 業者向けメール通知（新規予約時） ─────────────────────
function sendOwnerEmail(data, bookingId) {
  const emailProp = PROPS.getProperty("OWNER_EMAIL");
  if (!emailProp) return;

  const totalPersons =
    (data.numMale || 0) +
    (data.numFemale || 0) +
    (data.numChild || 0) +
    (data.numInfant || 0);

  const subject = `【KeyPhoto】新規予約 ${bookingId} / ${data.representativeName}様`;

  const lines = [
    "KeyPhoto 予約システムから新規予約が入りました。",
    "",
    "━━━━━━━━━━━━━━━━━━━━",
    `予約ID     : ${bookingId}`,
    `受付日時   : ${Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm")}`,
    "━━━━━━━━━━━━━━━━━━━━",
    `撮影希望日 : ${data.preferredDate}`,
    `プラン     : ${data.planName || data.plan}`,
    `送迎       : ${data.transferOption ? "あり" : "なし"}`,
    "",
    `代表者     : ${data.representativeName}`,
    `人数       : 合計${totalPersons}名`,
    `  男性     : ${data.numMale || 0}名`,
    `  女性     : ${data.numFemale || 0}名`,
    `  子供     : ${data.numChild || 0}名`,
    `  幼児     : ${data.numInfant || 0}名`,
    "",
    `携帯番号   : ${data.phone}`,
    `宿泊施設   : ${data.accommodation}`,
    `滞在期間   : ${data.stayFrom} 〜 ${data.stayTo}`,
    data.alternativeDate ? `振替希望日 : ${data.alternativeDate}` : null,
    data.instagram ? `Instagram  : ${data.instagram}` : null,
    "",
    "━━━━━━━━━━━━━━━━━━━━",
    "スプレッドシートで詳細を確認し、メニューから確定操作を行ってください。",
  ].filter(function (l) { return l !== null; });

  // スプレッドシートURL（あれば添付）
  try {
    const ss = SpreadsheetApp.openById(PROPS.getProperty("SPREADSHEET_ID"));
    if (ss) lines.push("", "シート: " + ss.getUrl());
  } catch (e) {}

  const body = lines.join("\n");

  // カンマ区切りで複数送信先対応
  const recipients = emailProp.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  recipients.forEach(function (to) {
    try {
      MailApp.sendEmail({
        to: to,
        subject: subject,
        body: body,
        name: "KeyPhoto 予約システム",
      });
    } catch (err) {
      console.error("メール送信失敗 " + to + ": " + err.message);
    }
  });
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
  const totalPersons = sheet.getRange(row, COL["合計人数"]).getValue();
  const phone = sheet.getRange(row, COL["携帯番号"]).getValue();
  const accommodation = sheet.getRange(row, COL["宿泊施設"]).getValue();
  const stayFrom = sheet.getRange(row, COL["滞在開始"]).getValue();
  const stayTo = sheet.getRange(row, COL["滞在終了"]).getValue();
  const alternativeDate = sheet.getRange(row, COL["振替希望日"]).getValue();
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
    const dateText = formatDateValue(date);
    const stayFromText = formatDateValue(stayFrom);
    const stayToText = formatDateValue(stayTo);
    const altText = formatDateValue(alternativeDate);
    const reservationSummary = [
      `📸 予約確定 [${bookingId}]`,
      `日付: ${dateText}`,
      `プラン: ${planName}`,
      `代表者: ${name}`,
      `人数: ${totalPersons}名`,
      `電話: ${phone}`,
      `宿泊: ${accommodation}`,
      `滞在: ${stayFromText} 〜 ${stayToText}`,
      altText ? `振替: ${altText}` : "",
    ].filter(Boolean).join("\n");

    message =
      `${reservationSummary}\n\n` +
      `【星空フォト】当日スケジュールのご案内 key photo様\n\n` +
      `1.集合場所について\n` +
      `撮影に最適な空のコンディションを追いかけるため、集合場所は当日確定いたします。当日正確な場所をお伝えします。事前に確定させてほしい場合は、あらかじめご連絡ください。\n\n` +
      `2.当日の開催判断について\n` +
      `星空撮影は雲の動きに左右されるため、最終的な開催判断は以下の通りとさせていただきます。\n` +
      `最終判断の時間: 当日18:00ごろ（天候が不安定な場合はそれ以降）\n` +
      `早めの判断をご希望の方へ: ご旅行のご都合などで早めの判断が必要な場合は、その時点での予報に基づいた判断をご連絡いたします。お気軽にお申し付けください。\n` +
      `中止の場合: 他日程への振替や、中止連絡の後に晴天へ回復した場合の再連絡も可能です。その都度お知らせください。\n\n` +
      `3.当日の服装・準備\n` +
      `服装: 白い服や明るい色のお洋服が、夜の背景にとても綺麗に映えます。足元は暗い場所を歩くため、歩きやすい靴が安心です。\n` +
      `防寒: 夜の屋外は冷え込むことがあります（特に12月〜3月ごろは、羽織るものを1枚お持ちいただくことをお勧めします）。\n\n` +
      `4.緊急連絡について\n` +
      `当日の道に迷った・少し遅れそうなどのご連絡は、現場スタッフが直接確認できるショートメッセージ（SMS）がスムーズです。\n` +
      `当日の緊急連絡先: ${PROPS.getProperty("EMERGENCY_CONTACT") || "LINEにてご連絡ください"}\n\n` +
      `満天の星空の下、最高の1枚を残せるようチーム一同願っております！\n` +
      `当日のご連絡まで、どうぞよろしくお願いいたします。\n` +
      `key photo`;
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

function formatDateValue(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, "Asia/Tokyo", "yyyy-MM-dd");
  }
  return String(value);
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
