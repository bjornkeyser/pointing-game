/**
 * Google Apps Script backend for the Arnhem Pointing Game.
 * Receives a JSON POST from index.html and appends one row per trial
 * to a sheet named "results" in the bound spreadsheet.
 *
 * Deploy as: Web app, Execute as "Me", Who has access "Anyone".
 */

const SHEET_NAME = "results";
const HEADER = [
  "timestamp", "name", "landmark", "trueBearing", "rawHeading",
  "heading", "error", "absError", "meanAbsError", "declination",
  "venueLat", "venueLon", "userAgent",
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADER);

    const rows = (data.trials || []).map(t => [
      data.timestamp, data.name, t.name, t.trueBearing, t.rawHeading,
      t.heading, t.error, t.absError, data.meanAbsError, data.declination,
      data.venue && data.venue.lat, data.venue && data.venue.lon, data.userAgent,
    ]);
    if (rows.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADER.length).setValues(rows);
    }
    return json({ ok: true, rows: rows.length });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Handy for checking the deployment works: open the /exec URL in a browser.
function doGet() {
  return json({ ok: true, message: "Pointing game endpoint is live. POST JSON here." });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
