# סרט לפי הטעם: ממשק חדש לנתוני cinema-dna

אתר סטטי (React 18 + Vite + TypeScript), עברית ו-RTL, בלי שרת. הנתונים נטענים מהקובץ הציבורי
`https://cinema-dna.pages.dev/final_classified_db.json` והתמונות מאחסון ה-R2 הציבורי.
האתר המקורי לא משתנה.

## הרצה מקומית
```bash
npm install
npm run dev        # פיתוח
npm run build      # בנייה ל-dist
npm run preview    # תצוגה של הבנייה
```
נדרש Node 18 ומעלה.

## פריסה ב-Cloudflare Pages (דומיין חדש)
1. צרו ריפו חדש, חלצו אליו את הארכיון ודחפו (git push).
2. ב-Cloudflare: Workers & Pages, Create, Pages, Connect to Git, בחרו את הריפו.
3. Build command: `npm run build`. Build output directory: `dist`. משתנה סביבה: `NODE_VERSION=20`.
4. אחרי הפריסה: Custom domains, Set up a custom domain, והוסיפו את הדומיין החדש.
   (בלי Git: `npm run build` ואז `npx wrangler pages deploy dist`).
5. אין צורך בקובץ הפניות: ל-Pages יש חזרה אוטומטית ל-index.html עבור כתובות כמו `/movie/...`.

## משתנים אופציונליים
ראו `.env.example`: `VITE_DATA_URL`, `VITE_IMAGE_BASE`. אם הקובץ המקוון לא נטען, האתר משתמש בעותק
שמור ב-`public/data-snapshot.json` (צילום מ-4.10.2026).

## מבנה
- `src/metrics.ts` הגדרת 12 המדדים בעברית פשוטה ומצבי הרוח
- `src/similarity.ts` חישוב דמיון (אותה נוסחה כמו באתר המקורי) והסברי "למה דומה"
- `src/data.tsx` טעינה, ניקוי נתונים, שמירת סרטים ב-localStorage
- `src/pages/*` המסכים

## נתונים ידועים כבעייתיים (מטופלים)
- הרשומה "חלומות" של הוגרד מעורבבת: תקציר וקישורים מוסתרים.
- מזהי IMDb שמופיעים בשני סרטים: הקישור מוסתר.
- פרסי אוסקר לא מוצגים (לא אומתו). פוסטר חסר מוחלף בכרטיס עם שם הסרט.

## הערת רישוי
המאגר והתמונות שייכים למפעילי האתר המקורי ולא נמצא רישיון שימוש. לפני שימוש ציבורי כדאי לברר הרשאה.
