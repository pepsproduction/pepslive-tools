# PepsProduction Analytics — Cloudflare Setup

The analytics dashboard is served at `/admin/analytics/`. The Worker denies the dashboard and its report API unless a signed Cloudflare Access JWT has the configured audience and the allowlisted email. The D1 collector accepts only small, same-site events from the public homepage.

## Current deployment status — 2026-10-27

The `pepsproduction-home` Worker and dashboard are deployed. Cloudflare contains the three Access secrets named below, and unauthenticated requests to both `/admin/analytics/` and `/admin/analytics/api/report` returned the Cloudflare Access sign-in page during verification. The secret values were not read. Owner login and denial using a second account still require a real authenticated browser session and were not tested.

## Cloudflare Access

To create or change Cloudflare Access protection:

1. In Cloudflare Zero Trust, create a **Self-hosted** Access application named `PepsProduction Analytics`.
2. Protect `pepsproduction.com` at path `/admin/analytics*`.
3. Add one **Allow** policy whose Include rule is the owner's exact email address. Keep the default deny behavior for everyone else.
4. Copy the application's **AUD** value and the organization's Access team domain, such as `https://example.cloudflareaccess.com`.

The Worker verifies the JWT signature against Cloudflare's published Access certificates, then checks issuer, audience, expiry, and the allowed email. The report endpoint is under the protected `/admin/analytics*` path and repeats the same checks in the Worker.

## Runtime secrets

These secrets are already present in the deployed Worker. Run the commands below only when setting up a new environment or rotating a value.

Set these values as Worker secrets so no identity or Access configuration is committed to the repository:

```powershell
npx wrangler secret put ANALYTICS_ADMIN_EMAIL
npx wrangler secret put ANALYTICS_TEAM_DOMAIN
npx wrangler secret put ANALYTICS_ACCESS_AUD
```

Wrangler prompts for each value without adding it to source files. `ANALYTICS_ADMIN_EMAIL` must exactly match the email in the Access Allow policy. The team domain and AUD must match the newly created application.

## Build and deploy

After Access and the three secrets are set:

```powershell
node scripts/build-cloudflare-site.mjs
npx wrangler deploy
```

The `ANALYTICS_DB` binding points to the separate `pepsproduction-analytics` D1 database. Its schema migration is under `migrations/`. A daily 01:00 Bangkok cleanup removes records older than 400 days. The Worker caps accepted events at 8,000 per Bangkok day to limit D1 writes.

## Verify access

- Signed out: the Access edge may return its sign-in HTML with HTTP 200. If a request reaches the Worker without an Access JWT (for example, when testing the Worker route directly), the Worker must return `403`.
- Signed in as the allowlisted owner: the page should load the report; direct report API calls should return JSON.
- Signed in as another email: Access must deny the page, and the Worker must reject a report request.
- The public collector is `/api/analytics/collect`. It accepts only allowlisted event shapes from the production site origins; it stores no IP, user-agent, referrer, typed text, or full URL.
