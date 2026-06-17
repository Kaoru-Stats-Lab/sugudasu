/**
 * SUGUDASU 改善リクエスト Form — 送信トリガー
 *
 * 設置: 回答スプレッドシート → 拡張機能 → Apps Script → 本ファイルを貼付
 * トリガー: onFormSubmitNotify · スプレッドシートから · フォーム送信時 · ヘッド
 *
 * Script Properties（任意）:
 *   NOTIFY_EMAIL      … 通知先（未設定時はスプレッドシート所有者）
 *   TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID … 設定時のみ Telegram も送信
 *
 * 列（1行目ヘッダー）: A〜F = Form 既定 · G=FB-ID · H=Status · I=Backlog · J=メモ
 */
/* global MailApp, UrlFetchApp, PropertiesService, Utilities */

var COL = {
  TIMESTAMP: 1,
  TYPE: 2,
  TOOL: 3,
  BODY: 4,
  PAGE_URL: 5,
  REPLY: 6,
  FB_ID: 7,
  STATUS: 8,
  BACKLOG: 9,
  MEMO: 10,
};

/** Status 列（H）プルダウン — docs/FEEDBACK_TRIAGE.md と同期 */
var STATUS_OPTIONS = [
  'inbox',
  '要件定義',
  'planned',
  'done',
  'wontfix',
  'duplicate',
];

function onFormSubmitNotify(e) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  var row = e.range.getRow();
  if (row < 2) return;

  var fbId = String(sheet.getRange(row, COL.FB_ID).getValue() || '').trim();
  if (!fbId) {
    fbId = nextFbId_(sheet, row);
    sheet.getRange(row, COL.FB_ID).setValue(fbId);
  }

  var status = String(sheet.getRange(row, COL.STATUS).getValue() || '').trim();
  if (!status) {
    sheet.getRange(row, COL.STATUS).setValue('inbox');
    status = 'inbox';
  }

  applyStatusDropdownToRow_(sheet, row);

  var payload = readRow_(sheet, row, fbId, status);
  sendEmailNotify_(payload);
  sendTelegramNotify_(payload);
}

function readRow_(sheet, row, fbId, status) {
  return {
    fbId: fbId,
    status: status,
    timestamp: cell_(sheet, row, COL.TIMESTAMP),
    type: cell_(sheet, row, COL.TYPE),
    tool: cell_(sheet, row, COL.TOOL),
    body: cell_(sheet, row, COL.BODY),
    pageUrl: cell_(sheet, row, COL.PAGE_URL),
    reply: cell_(sheet, row, COL.REPLY),
    sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    row: row,
  };
}

function cell_(sheet, row, col) {
  return String(sheet.getRange(row, col).getValue() || '').trim();
}

/** FB-YYYYMMDD-NNN（同日の最大連番 +1） */
function nextFbId_(sheet, row) {
  var ts = sheet.getRange(row, COL.TIMESTAMP).getValue();
  var d = ts instanceof Date ? ts : new Date();
  if (isNaN(d.getTime())) d = new Date();

  var ymd = Utilities.formatDate(d, Session.getScriptTimeZone() || 'Asia/Tokyo', 'yyyyMMdd');
  var prefix = 'FB-' + ymd + '-';
  var lastRow = sheet.getLastRow();
  var max = 0;

  if (lastRow >= 2) {
    var ids = sheet.getRange(2, COL.FB_ID, lastRow, COL.FB_ID).getValues();
    for (var i = 0; i < ids.length; i++) {
      var s = String(ids[i][0] || '');
      if (s.indexOf(prefix) !== 0) continue;
      var n = parseInt(s.slice(prefix.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  }

  return prefix + ('000' + (max + 1)).slice(-3);
}

/** H 列全体に Status プルダウン（初回1回 · エディタから手動実行） */
function setupStatusDropdown() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var lastRow = Math.max(sheet.getLastRow(), 2);
  var endRow = Math.max(lastRow + 100, 500);
  applyStatusDropdownToRange_(sheet, 2, endRow);
  SpreadsheetApp.getUi().alert(
    'Status 列（H）にプルダウンを設定しました（行 2〜' + endRow + '）。\n' +
      STATUS_OPTIONS.join(' / ')
  );
}

function applyStatusDropdownToRow_(sheet, row) {
  applyStatusDropdownToRange_(sheet, row, row);
}

function applyStatusDropdownToRange_(sheet, startRow, endRow) {
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(startRow, COL.STATUS, endRow, COL.STATUS).setDataValidation(rule);
}

function sendEmailNotify_(p) {
  var to = PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL');
  if (!to) {
    to = SpreadsheetApp.getActiveSpreadsheet().getOwner().getEmail();
  }
  if (!to) return;

  var subject = '[SUGUDASU] 改善リクエスト ' + p.fbId + ' · ' + (p.tool || '全体');
  var body = [
    '新しい改善リクエストが届きました。',
    '',
    'FB-ID: ' + p.fbId,
    'Status: ' + p.status + '（スプシで更新）',
    '種別: ' + (p.type || '—'),
    '対象: ' + (p.tool || '—'),
    '内容:',
    p.body || '（空）',
    '',
    '送信元URL: ' + (p.pageUrl || '—'),
    '返信希望: ' + (p.reply || '—'),
    '',
    'スプレッドシート（行 ' + p.row + '）:',
    p.sheetUrl,
    '',
    '---',
    'トリアージ: docs/FEEDBACK_TRIAGE.md · GitHub BACKLOG §12 以降',
  ].join('\n');

  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: body,
  });
}

function sendTelegramNotify_(p) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TELEGRAM_BOT_TOKEN');
  var chatId = props.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chatId) return;

  var text = [
    '📬 SUGUDASU 改善リクエスト',
    p.fbId + ' · ' + p.status,
    (p.type || '') + ' / ' + (p.tool || '全体'),
    '',
    (p.body || '（空）').slice(0, 500),
  ].join('\n');

  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: chatId,
      text: text,
      disable_web_page_preview: true,
    }),
    muteHttpExceptions: true,
  });
}

/** 初回テスト用（エディタから手動実行） */
function testNotifyLastRow() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var row = sheet.getLastRow();
  if (row < 2) throw new Error('データ行がありません');

  var fbId = String(sheet.getRange(row, COL.FB_ID).getValue() || '').trim() || nextFbId_(sheet, row);
  var status = String(sheet.getRange(row, COL.STATUS).getValue() || '').trim() || 'inbox';
  var payload = readRow_(sheet, row, fbId, status);
  sendEmailNotify_(payload);
  sendTelegramNotify_(payload);
}
