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

## Dashboard URL

https://pepsproduction.github.io/pepslive-tools/dashboard.html#admin

The public site sends only click analytics. No passwords, API keys, GitHub tokens, or private Google credentials are stored in this repository.
