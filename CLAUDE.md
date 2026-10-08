# Working on this repo

## Language
- **Everything is in English** except text shown to end users: code, comments, identifiers, internal/log error messages, commit messages, branch names, PR titles and descriptions, docs and this file.
- User-facing UI copy stays in Hebrew (via `src/i18n.tsx`).
- Existing Hebrew comments and docs are legacy; convert them when touching a file, not in drive-by edits.

## Git
- **Never push directly to `main`.** Every change goes on its own branch (`feat/...`, `fix/...`, `chore/...`) and through a PR. Only Yehuda merges.
- No force pushes to `main`.
- Every push to `main` triggers a deploy to GitHub Pages (`.github/workflows/deploy.yml`), so merge = live.

## Context
- React 18 + Vite + TypeScript, react-router-dom.
- Before opening a PR: `npm run build` (includes `tsc --noEmit`) must pass.
