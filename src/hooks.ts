import { useMemo } from 'react'
import { useData } from './data'
import { buildStats } from './similarity'

export function useStats() {
  const { movies } = useData()
  return useMemo(() => buildStats(movies), [movies])
}
