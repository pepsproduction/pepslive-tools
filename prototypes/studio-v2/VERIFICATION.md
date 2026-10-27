# Verification — 2026-10-27

## VERIFIED

- `npm run build`: passed; static output at dist with relative asset paths.
- Browser loaded final production bundle (`assets/index-Cd71ND4F.js`) and rendered the hero; Liquid Glass reported `data-glass-ready=true`.
- Hero mode buttons changed selected state and rendered scene; director camera selection and score increment responded. Score overlay toggled off and on.
- Replay entered its active slow-motion state; reset restored the initial controls. Reset now also returns the simulation timeline to eight seconds.
- Event filter reduced five portfolio cards to one; portfolio details and plan dialogs opened; close button dismissed the plan dialog.
- Mobile menu expanded/collapsed; motion toggle changed to the resume state.
- Horizontal overflow corrected at its source: decorative tool orbits are clipped to their section. At viewport widths 390/360, scrollWidth equaled clientWidth (375/345 with scrollbar). Desktop default width 1051 also had no horizontal overflow.
- Source components remain in `prototypes/studio-v2`; the production build bundles them to `assets/studio-v2/`. Pre-existing root data and site files were retained.

## Preview note

Vite's development WebSocket disconnected during a config-triggered restart. The delivered preview now serves the production build with `npm run preview`, so it does not load the HMR client. No new application errors were observed after loading the build; the tab's console history still contains the earlier development-client errors.

## NOT VERIFIED

- Physical phone performance, sustained GPU load/FPS, and OBS embedded browser behavior.
- Forced WebGL loss/failure recovery and OS-level reduced-motion emulation. The in-page motion control was tested.
- External download completion or sending a message/call through the public contact links.
- Analytics dashboard owner login or denial using a second account; the signed-out Access gate was verified.

Screenshots in ignored artifacts/: desktop-final.jpg and mobile-final.jpg. All scores and replay events are simulated.

## Production follow-up — 2026-10-27

### VERIFIED

- Cloudflare Worker production deployment `2c337650-8408-4354-8829-991433df6350` serves CSS cache key `20261027-5`.
- Current Worker version `849931c4-7875-4ffa-a396-20333dc980e8` deployed at 2026-10-27 05:07 UTC; live homepage and JS both serve the updated visitor-count fallback, and the read-only visitor endpoint responded successfully.
- At the actual browser viewport 2560×889, the Experience section, 1280×613 desk, 1002×501 3D viewport, side controls, and camera buttons fit without horizontal overflow; the complete demo card fits below the fixed header.
- Production camera switching, score increment/reset, and initial score state worked. Browser console reported no errors.
- Production `/api/schedule` returned connected; `/api/youtube-upcoming` returned connected with no currently scheduled public streams; `/api/youtube-portfolio` returned eight items; `/api/visitor` read-only returned a valid count.
- Cloudflare reports no pending D1 migrations. All five Worker secret names required by Calendar, YouTube, and analytics are present; secret values were not read.
- Signed-out requests to the analytics page and report endpoint showed the Cloudflare Access sign-in page. Access owner login and denial with another account were not attempted.
- All six Worker/calendar/portfolio test scripts passed after the production-responsive changes.
- Wrangler locally invoked the configured `scheduled()` handler against local D1 successfully at 2026-10-27 05:03 UTC; the local portfolio snapshot contained eight items.

### Still not verified

- Production Cron after the current Worker deployment is not yet verified. The latest deployment was at 05:07 UTC on 2026-10-27, after the previous daily trigger; the next run is due at 18:00 UTC that day (01:00 Bangkok on 2026-10-28). Check the D1 snapshot timestamp or scheduled logs after that run.
- Sustained GPU performance on a physical phone, the OBS Browser Source runtime, forced WebGL context loss/recovery, and OS-level reduced-motion emulation require their respective runtime environments.
- Completing an external Launcher download, sending a contact message/call, or logging into the private analytics dashboard was outside this verification.
