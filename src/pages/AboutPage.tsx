import { METRICS } from '../metrics'
import { useLang } from '../i18n'

export default function AboutPage() {
  const { lang } = useLang()
  if (lang === 'en') {
    return (
      <article className="prose">
        <h1>How it works</h1>
        <p>Every movie in the database has 12 scores that describe how it feels to watch: for example whether it is light or heavy, realistic or dreamlike, quiet or stormy. The scores were produced with a language model. They are an estimate, not a fact, and may contain mistakes.</p>
        <h2>How similar movies are chosen</h2>
        <p>The site compares the scores of the movie you picked with the scores of every other movie. The closer the scores, the more similar the movie. Traits that matter more for matching (like warmth and depth) count more than others (like violence). Movies by the same director get a small bonus.</p>
        <p><b>The match percentage is only the method's score.</b> It doesn't mean you'll like the movie, and it isn't a rating of the movie's quality.</p>
        <h2>The traits</h2>
        <ul>{METRICS.map((m) => <li key={m.key}><b>{m.name.en}:</b> from "{m.low.en}" on one end to "{m.high.en}" on the other.</li>)}</ul>
        <h2>What's not here</h2>
        <p>There are no showtimes, streaming options, cast lists or audience ratings. The database covers movies from 1975 to 2025 and isn't complete. The violence and sexual content scores are the model's estimate, not an official rating, so don't rely on them when watching with children.</p>
        <p>Some details in the original database are wrong (for example a link to a different movie). When we spotted one, we hid it. Oscar information isn't shown because it hasn't been verified.</p>
      </article>
    )
  }
  return (
    <article className="prose">
      <h1>איך זה עובד</h1>
      <p>לכל סרט במאגר יש 12 ציונים שמתארים איך הוא מרגיש לצפייה: למשל אם הוא קליל או כבד, מציאותי או חלומי, שקט או סוער. הציונים נוצרו בעזרת מודל שפה. הם הערכה ולא עובדה, וייתכנו בהם טעויות.</p>
      <h2>איך נבחרים סרטים דומים</h2>
      <p>האתר משווה את הציונים של הסרט שבחרתם לציונים של כל סרט אחר. ככל שהציונים קרובים יותר, הסרט דומה יותר. תכונות שחשובות יותר להתאמה (כמו חום ועומק) משפיעות יותר מאחרות (כמו אלימות). סרטים של אותו במאי מקבלים תוספת קטנה.</p>
      <p><b>אחוז הדמיון הוא ציון של השיטה בלבד.</b> הוא לא אומר שתאהבו את הסרט, והוא לא דירוג של איכות הסרט.</p>
      <h2>התכונות</h2>
      <ul>{METRICS.map((m) => <li key={m.key}><b>{m.name.he}:</b> מצד אחד "{m.low.he}", מהצד השני "{m.high.he}".</li>)}</ul>
      <h2>מה אין כאן</h2>
      <p>אין כאן זמני הקרנה, איפה לצפות, שחקנים או דירוגי צופים. המאגר כולל סרטים מ-1975 עד 2025 ואינו מלא. הציונים של אלימות ותוכן מיני הם הערכה של המודל ולא סיווג רשמי, אז אל תסמכו עליהם לצפייה עם ילדים.</p>
      <p>חלק מהפרטים במאגר המקורי שגויים (למשל קישור לסרט אחר). כשזיהינו כזה, הסתרנו אותו. מידע על פרסי אוסקר לא מוצג כי לא אומת.</p>
    </article>
  )
}
