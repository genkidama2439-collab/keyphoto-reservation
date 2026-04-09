/**
 * KeyPhoto 予約受付 - Google Apps Script
 *
 * スプレッドシートに予約データを保存し、
 * Googleカレンダーに予定を作成し、
 * LINE Messaging APIで通知を送信する。
 *
 * スクリプトプロパティに以下を設定:
 * - SPREADSHEET_ID: 予約データ保存先のスプレッドシートID
 * - CALENDAR_ID: Googleカレンダー ID
 * - LINE_CHANNEL_ACCESS_TOKEN: LINE Messaging API チャンネルアクセストークン
 * - OWNER_LINE_USER_ID: オーナーのLINEユーザーID
 */

const PROPS = PropertiesService.getScriptProperties();

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch {
    return jsonResponse({ success: false, message: "サーバーが混雑しています" });
  }

  try {
    const data = JSON.parse(e.postData.contents);
    saveToSpreadsheet(data);
    createCalendarEvent(data);
    sendLineNotification(data);
    return jsonResponse({ success: true, message: "予約を受け付けました" });
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

function saveToSpreadsheet(data) {
  const ss = SpreadsheetApp.openById(PROPS.getProperty("SPREADSHEET_ID"));
  const sheet = ss.getSheetByName("予約") || ss.insertSheet("予約");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "受付日時",
      "LINE ID",
      "LINE名",
      "撮影希望日",
      "プラン",
      "送迎",
      "代表者名",
      "男性",
      "女性",
      "子供",
      "幼児",
      "合計人数",
      "携帯番号",
      "宿泊施設",
      "滞在開始",
      "滞在終了",
      "振替希望日",
      "Instagram",
    ]);
  }

  const totalPersons =
    (data.numMale || 0) +
    (data.numFemale || 0) +
    (data.numChild || 0) +
    (data.numInfant || 0);

  sheet.appendRow([
    new Date(),
    data.lineUserId,
    data.lineDisplayName,
    data.preferredDate,
    data.plan,
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
  ]);
}

function createCalendarEvent(data) {
  const calendarId = PROPS.getProperty("CALENDAR_ID");
  if (!calendarId) return;

  const calendar = CalendarApp.getCalendarById(calendarId);
  if (!calendar) return;

  const date = new Date(data.preferredDate);
  const title = `📸 ${data.representativeName}様 - ${data.plan}`;
  const totalPersons =
    (data.numMale || 0) +
    (data.numFemale || 0) +
    (data.numChild || 0) +
    (data.numInfant || 0);
  const description = [
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

function sendLineNotification(data) {
  const token = PROPS.getProperty("LINE_CHANNEL_ACCESS_TOKEN");
  if (!token) return;

  const totalPersons =
    (data.numMale || 0) +
    (data.numFemale || 0) +
    (data.numChild || 0) +
    (data.numInfant || 0);

  const message =
    `🌟 ご予約ありがとうございます！\n\n` +
    `📅 撮影日: ${data.preferredDate}\n` +
    `📋 プラン: ${data.plan}\n` +
    `👤 代表者: ${data.representativeName}\n` +
    `👥 人数: ${totalPersons}名\n` +
    (data.alternativeDate ? `🔄 振替希望日: ${data.alternativeDate}\n` : "") +
    `\n詳細はスタッフよりLINEでご連絡いたします。`;

  // お客様への通知
  if (data.lineUserId) {
    pushMessage(token, data.lineUserId, message);
  }

  // オーナーへの通知
  const ownerId = PROPS.getProperty("OWNER_LINE_USER_ID");
  if (ownerId) {
    const ownerMessage =
      `📸 新規予約\n\n` +
      `日付: ${data.preferredDate}\n` +
      `プラン: ${data.plan}\n` +
      `代表者: ${data.representativeName}\n` +
      `人数: ${totalPersons}名\n` +
      `電話: ${data.phone}\n` +
      `宿泊: ${data.accommodation}\n` +
      `滞在: ${data.stayFrom} 〜 ${data.stayTo}\n` +
      (data.transferOption ? "送迎: あり\n" : "") +
      (data.alternativeDate ? `振替: ${data.alternativeDate}\n` : "") +
      (data.instagram ? `IG: ${data.instagram}` : "");
    pushMessage(token, ownerId, ownerMessage);
  }
}

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
