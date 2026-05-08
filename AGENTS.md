# AGENTS.md

## Project Scope
This repository belongs to PepsProduction / PepsLive. It may contain static web tools, OBS dock interfaces, tournament tools, live-production utilities, or related code.

## Default Working Rules for ChatGPT / Codex
- Reply to the user in Thai unless the user requests another language.
- Prefer safe, targeted fixes over large rewrites.
- Preserve existing features unless the user explicitly asks to remove them.
- Keep GitHub Pages compatibility when this is a web project.
- Keep OBS Browser Source compatibility when the project includes live overlays, docks, preview pages, or control panels.
- Use relative paths for static assets.
- Do not add secrets, API keys, tokens, private keys, passwords, or credentials to the repository.
- Do not require a backend server unless the user explicitly asks for one.
- When editing code, summarize changed files, visible behavior changes, and risk points.
- For substantial work, prefer branch + Pull Request. For small AI instruction/config files, direct commit is acceptable when requested.

## UI Direction
- Keep PepsLive visual identity consistent: clean sports-production UI, pastel/neon accents, glass panels, readable typography, capsule-style buttons, and practical live-control layouts.
- Prioritize readability during live operation over decorative effects.
- Avoid animations that make OBS/browser performance unstable.

## Code Quality Rules
- Keep JavaScript, HTML, and CSS readable and easy to patch.
- Avoid duplicate logic when a helper function is appropriate.
- Avoid breaking localStorage/data export behavior unless explicitly requested.
- If modifying event handlers, check for duplicate triggers and stale state bugs.
- If modifying asset paths, verify GitHub Pages and local file usage.

## Manual Smoke Checks
Before finalizing a change, check as applicable:
1. Main page loads without console errors.
2. CSS and JS files load with relative paths.
3. Core buttons still respond.
4. Layout remains usable on desktop and OBS Browser Source sizes.
5. Export/copy/backup flows still work if present.
6. No secrets are committed.

## User Preference
The user prefers direct, copy-ready code or complete replacement files when requested. Keep explanations concise and practical.