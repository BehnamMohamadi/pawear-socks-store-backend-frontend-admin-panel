const WEBHOOK_SECRET = "secret-1234-secret-WEBHOOK_SECRETejeieeee222222222222";
const PREFIX = "pawear_";
function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || "{}");
    if (
      !WEBHOOK_SECRET ||
      WEBHOOK_SECRET.startsWith("REPLACE_") ||
      payload.secret !== WEBHOOK_SECRET
    )
      throw new Error("Unauthorized");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!payload.spreadsheetId || payload.spreadsheetId !== ss.getId())
      throw new Error("Spreadsheet ID mismatch");
    const tables = payload.snapshot && payload.snapshot.collections;
    if (!Array.isArray(tables)) throw new Error("Invalid snapshot");
    const lock = LockService.getDocumentLock();
    if (!lock.tryLock(10000)) throw new Error("Another sync is running");
    try {
      tables.forEach((t) => syncTable_(ss, t));
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true, collections: tables.length });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}
function syncTable_(ss, t) {
  if (!t || !Array.isArray(t.columns) || !Array.isArray(t.rows))
    throw new Error("Invalid collection");
  const name =
    PREFIX +
    String(t.name || "collection")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 80);
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  const values = [t.columns]
    .concat(t.rows)
    .map((r) => t.columns.map((_, i) => cell_(r[i])));
  sh.clearContents();
  sh.clearFormats();
  if (values.length && values[0].length) {
    if (sh.getMaxRows() < values.length)
      sh.insertRowsAfter(sh.getMaxRows(), values.length - sh.getMaxRows());
    if (sh.getMaxColumns() < values[0].length)
      sh.insertColumnsAfter(sh.getMaxColumns(), values[0].length - sh.getMaxColumns());
    const range = sh.getRange(1, 1, values.length, values[0].length);
    range.setNumberFormat("@");
    range.setValues(values);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, values[0].length).setFontWeight("bold");
    const f = sh.getFilter();
    if (f) f.remove();
    range.createFilter();
  }
}
function cell_(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  const s = String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : v;
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
