import { useEffect, useState } from 'react'

const parse = () => (window.location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean)

export function useRoute() {
  const [r, setR] = useState(parse)
  useEffect(() => {
    const h = () => {
      setR(parse())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  return r
}

export const go = (path) => (window.location.hash = path)
