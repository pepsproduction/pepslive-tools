# PEPSLIVE Click Analytics Setup

Google Sheet:

https://docs.google.com/spreadsheets/d/1QiONjsc7hc_9BjXBOF8QJW8LsbHC9uIwzq8FmhiUaJc

## Deploy Google Apps Script

1. Open the Google Sheet above.
2. Go to Extensions > Apps Script.
3. Replace the default code with `apps-script/pepslive-click-analytics.gs`.
4. Run `setupSheets` once and allow permissions.
5. Click Deploy > New deployment.
6. Select type: Web app.
7. Execute as: Me.
8. Who has access: Anyone.
9. Copy the Web App URL ending with `/exec`.
10. Open `index.html#admin` > Settings and paste that URL into:
    - Click tracking endpoint
    - Dashboard endpoint
11. Save to GitHub from the Admin UI.

## Visitor Counter

The public visitor counter uses the same Apps Script Web App but a separate `Visitors` tab.

1. Replace the Apps Script project code with `apps-script/pepslive-click-analytics.gs`.
2. If the old counter total is known, set `VISITOR_START_VALUE` near the top of the script to that number before the first visitor request. If it is unknown, leave it at `0`; the old CounterAPI endpoint is not a recoverable data source.
3. Run `setupSheets` once. This creates the `Visitors` tab without deleting the existing `Clicks` data.
4. Deploy a new version of the same Web App with **Execute as: Me** and **Who has access: Anyone**.
5. Put that Web App URL in `data.json` as `analytics.visitorEndpoint` and keep `analytics.provider` as `appsScript`.

The script never lowers the saved seed. Each visitor request is protected by a script lock and duplicate `visit_key` requests return the existing total, so retries and opening multiple pages do not reset or double-count the same day/session.

Read-only smoke checks after deployment:

- `.../exec?mode=health`
- `.../exec?mode=visitor-read`

## Dashboard URL

https://pepsproduction.github.io/pepslive-tools/dashboard.html#admin

The public site sends only click analytics. No passwords, API keys, GitHub tokens, or private Google credentials are stored in this repository.
