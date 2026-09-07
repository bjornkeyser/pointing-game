/**
 * Google Apps Script backend voor "Wijs het aan!".
 * Ontvangt één JSON POST per wijs en schrijft die als één rij in het
 * tabblad "results" van de gekoppelde spreadsheet.
 *
 * Deploy als: Web-app, Uitvoeren als "Ik", Toegang "Iedereen".
 * Na een wijziging: Implementeren → Implementaties beheren → Nieuwe versie.
 *
 * Gemiddelde per team in de Sheet, bijv. in een ander tabblad:
 *   =AVERAGEIF(results!B:B; "Team X"; results!I:I)
 * of maak een draaitabel op kolom team met gemiddelde van absError.
 */

const SHEET_NAME = "results";
const HEADER = [
  "receivedAt", "team", "sessionId", "trialIndex", "trialCount",
  "landmark", "trueBearing", "heading", "error", "absError", "rawHeading",
  "landmarkLat", "landmarkLon", "guessLat", "guessLon",
  "trialTime", "declination", "venueLat", "venueLon", "userAgent",
];

function doPost(e) {
  // Meerdere teams posten tegelijk; de lock zorgt dat rijen niet door elkaar lopen.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const data = JSON.parse(e.postData.contents);
    const t = data.trial || {};
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADER);

    sheet.appendRow([
      new Date().toISOString(), data.team, data.sessionId, data.trialIndex, data.trialCount,
      t.name, t.trueBearing, t.heading, t.error, t.absError, t.rawHeading,
      t.lat, t.lon, t.guessLat, t.guessLon,
      t.t, data.declination, data.venue && data.venue.lat, data.venue && data.venue.lon, data.userAgent,
    ]);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// GET zonder parameters: check of de deployment werkt.
// GET ?action=results: alle rijen als JSON, voor scoreboard.html.
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action !== "results") {
    return json({ ok: true, message: "Pointing game endpoint is live. POST JSON here." });
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return json({ ok: true, rows: [] });
  const values = sheet.getDataRange().getValues();
  const header = values[0];
  const rows = values.slice(1).map(r => {
    const o = {};
    header.forEach((h, i) => { o[h] = r[i] instanceof Date ? r[i].toISOString() : r[i]; });
    return o;
  });
  return json({ ok: true, rows: rows });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
