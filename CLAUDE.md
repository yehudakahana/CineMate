# הוראות לעבודה על הריפו

## Git
- **אף פעם לא לדחוף ישירות ל-`main`.** כל שינוי בענף נפרד (`feat/...`, `fix/...`, `chore/...`) ונפתח PR. ה-merge נעשה רק על ידי יהודה.
- אין force push ל-`main`.
- כל push ל-`main` מפעיל deploy ל-GitHub Pages (`.github/workflows/deploy.yml`), ולכן merge = עלייה לאוויר.

## הקשר
- React 18 + Vite + TypeScript, ‏react-router-dom.
- UI בעברית (עם i18n ב-`src/i18n.tsx`), קוד וקומיטים באנגלית.
- לפני PR: `npm run build` (כולל `tsc --noEmit`) צריך לעבור.
