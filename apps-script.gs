const SHEET_NAME = 'Orders';
const NOTIFY_EMAIL = 'hello@obarai.com';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    var c = data.customer || {};
    var p = data.payment || {};

    var monthly = (data.monthly ? data.monthly.price : 0) + (data.ai ? data.ai.price : 0);
    var setup = data.promoApplied ? 0 : (data.onboarding ? data.onboarding.price : 888);
    var kbPrice = data.promoApplied ? 0 : (data.ai_kb ? data.ai_kb.price : 0);
    var firstPay = setup + kbPrice + monthly;

    var row = [
      data.submittedAt || new Date().toISOString(),
      data.monthly ? data.monthly.label : '',
      data.ai ? data.ai.label : '',
      data.ai_kb ? data.ai_kb.label : '',
      data.billing || 'monthly',
      firstPay,
      monthly,
      data.promoCode || '',
      c.company || '',
      c.address || '',
      c.taxid || '',
      c.ownerName || '',
      c.ownerPhone || '',
      c.ownerEmail || '',
      c.contactName || '',
      c.contactPhone || '',
      c.contactEmail || '',
      p.cardHolder || '',
      p.cardLast4 || '',
      p.expiry || '',
      data.legalAcceptedAt || ''
    ];

    sheet.appendRow(row);
    sendNotify(data, firstPay, monthly);

    var clientEmail = c.ownerEmail || c.contactEmail;
    if (clientEmail) {
      sendConfirm(clientEmail, c.ownerName || c.contactName, data.monthly ? data.monthly.label : '', firstPay, monthly);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendNotify(data, firstPay, monthly) {
  var c = data.customer || {};
  var subject = '【ORBIT 新訂單】' + (c.company || c.ownerName) + ' - ' + (data.monthly ? data.monthly.label : '');
  var body = '新訂單通知\n\n'
    + '公司名稱：' + (c.company || '—') + '\n'
    + '統編：' + (c.taxid || '無') + '\n'
    + '負責人：' + (c.ownerName || '—') + '（' + (c.ownerPhone || '—') + '）\n'
    + 'Email：' + (c.ownerEmail || '—') + '\n\n'
    + '方案：' + (data.monthly ? data.monthly.label : '—') + '\n'
    + 'AI加購：' + (data.ai ? data.ai.label : '無') + '\n'
    + '今日付款：NT$' + firstPay + '\n'
    + '每月月費：NT$' + monthly + '\n'
    + '優惠碼：' + (data.promoCode || '無') + '\n\n'
    + '持卡人：' + (data.payment ? data.payment.cardHolder : '—') + '\n'
    + '卡號末4碼：' + (data.payment ? data.payment.cardLast4 : '—') + '\n\n'
    + '送出時間：' + (data.submittedAt || '') + '\n'
    + '條款同意：' + (data.legalAcceptedAt || '') + '\n\n'
    + '請至 Google Sheets 查看完整紀錄。';

  GmailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

function sendConfirm(email, name, plan, firstPay, monthly) {
  var subject = '【ORBIT】訂閱申請確認';
  var body = (name || '您') + ' 您好，\n\n'
    + '感謝您申請訂閱 ORBIT ' + plan + '。\n\n'
    + '我們已收到您的訂閱申請，團隊將在 24 小時內與您聯繫，完成帳號建立並啟動服務。\n\n'
    + '訂閱摘要\n'
    + '──────────────\n'
    + '方案：' + plan + '\n'
    + '今日付款：NT$' + firstPay + '\n'
    + '第二個月起每月：NT$' + monthly + '\n'
    + '最低服務期：12 個月\n'
    + '──────────────\n\n'
    + '如有任何問題，請聯繫：hello@obarai.com\n\n'
    + 'ORBIT 團隊\n'
    + '鎧洋聲影科技（OBARAI INTELLIGENCE）';

  GmailApp.sendEmail(email, subject, body);
}
