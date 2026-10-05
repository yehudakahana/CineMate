import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Director, Movie } from './data'

export type Lang = 'he' | 'en'

const KEY = 'cdna-lang-v1'
const TITLES: Record<Lang, string> = {
  he: 'סרט לפי הטעם | גלו סרטים שמרגישים כמו סרט שאהבתם',
  en: 'CineMate | Find movies that feel like the ones you love',
}

function readLang(): Lang {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'he' || v === 'en') return v
  } catch { /* ignore */ }
  return 'he'
}

interface LangState {
  lang: Lang
  setLang: (l: Lang) => void
  /** בוחר את הטקסט לפי השפה */
  t: (he: string, en: string) => string
  /** מספר מעוצב לפי השפה */
  num: (n: number) => string
  title: (m: Movie) => string
  director: (m: Movie) => string
  directorName: (d: Director) => string
}

const Ctx = createContext<LangState | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang)

  useEffect(() => {
    const el = document.documentElement
    el.lang = lang
    el.dir = lang === 'he' ? 'rtl' : 'ltr'
    document.title = TITLES[lang]
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem(KEY, l) } catch { /* ignore */ }
    setLangState(l)
  }, [])

  const value = useMemo<LangState>(() => {
    const he = lang === 'he'
    return {
      lang,
      setLang,
      t: (h, e) => (he ? h : e),
      num: (n) => n.toLocaleString(lang),
      title: (m) => (he ? m.title : m.titleEn || m.title),
      director: (m) => (he ? m.director : m.directorEn || m.director),
      directorName: (d) => (he ? d.name : d.nameEn || d.name),
    }
  }, [lang, setLang])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLang(): LangState {
  const c = useContext(Ctx)
  if (!c) throw new Error('no lang')
  return c
}
