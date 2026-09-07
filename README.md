# Arnhem Pointing Game

A single-file party game. Guests open the page on their phone, enter their name,
point the phone at Arnhem landmarks, and get scored on how far off they were.
Results are posted to a Google Sheet.

Files:

- `index.html` – the whole app (vanilla JS, no build step)
- `Code.gs` – Google Apps Script that receives results and writes them to a Sheet

## 1. Configure the game

Open `index.html` and edit the `CONFIG` block at the top of the `<script>`:

- `venue` – lat/lon of the party location. All bearings are computed from here.
- `landmarks` – name + lat/lon per landmark. Get coordinates by right-clicking in Google Maps.
- `declination` – magnetic declination at Arnhem, about +2° (east). Fine to leave.
- `endpoint` – the Apps Script URL from step 2.
- `shuffle` – randomise landmark order per player.

The UI is in Dutch. The results screen shows a map (Leaflet + OpenStreetMap tiles, loaded from a CDN, so guests need internet).

Pick landmarks that are far away (a kilometre or more). The bearing to something
close by changes too much depending on where in the room a guest is standing.

## 2. Set up the Google Sheet backend

1. Create a new Google Sheet.
2. Extensions → Apps Script. Delete the default code and paste in `Code.gs`. Save.
3. Deploy → New deployment → type **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Authorise when prompted, then copy the URL ending in `/exec`.
5. Paste it into `CONFIG.endpoint` in `index.html`.

Opening the `/exec` URL in a browser should show `{"ok":true,...}`.
Every single pointing attempt is posted immediately as one row in a sheet called `results`, so you can watch teams progress live. Compute a team's mean in the Sheet, e.g. `=AVERAGEIF(results!B:B; "Team X"; results!J:J)` or a pivot table on `team` with average of `absError`.

If you change `Code.gs` later, you must create a **new deployment** (or edit the
existing one to a new version) for the change to go live.

## 3. Publish on GitHub Pages

1. Push this folder to a GitHub repository.
2. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Open `https://<user>.github.io/<repo>/` on your phone.

HTTPS is required: iOS only exposes the compass on secure pages, and GitHub Pages
provides that for free.

## Notes on the compass

- iPhone: Safari asks for motion permission when the guest taps "Enable compass".
  This must happen from a tap, which is why there is a separate permission screen.
- Android: Chrome needs no permission. The app uses `deviceorientationabsolute` when available.
- The live compass value is deliberately hidden during play; the rotating dial only shows that the sensor works.
- Laptops usually have no compass. Append `?debug=1` to the URL for a debug panel
  with a fake-heading slider so you can test the scoring without a phone.
- Phone compasses can be off by 5 to 15° depending on the device and nearby metal.
  Guests can improve accuracy by waving the phone in a figure-eight before starting.
- Progress is saved on the phone after every attempt. If the page reloads, the app offers to continue where the team left off, and posts that failed (no connection) are retried automatically.
