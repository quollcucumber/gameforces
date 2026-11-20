export const other = (t) => 1 - t
export const sortNum = (a) => a.slice().sort((x, y) => x - y)
export const sum = (a) => a.reduce((x, y) => x + y, 0)
export const uniq = (a) => [...new Set(a)]
export function divisors(n) {
  const r = []
  for (let d = 1; d * d <= n; d++) if (n % d === 0) r.push(d, n / d)
  return uniq(r).sort((x, y) => x - y)
}
export const isPal = (s) => s === [...s].reverse().join('')
export const mex = (arr) => {
  const st = new Set(arr)
  let m = 0
  while (st.has(m)) m++
  return m
}
// Size parameter for a tier. Tiers above Hard keep growing by the Hard - Medium step; values that don't grow
// (decreasing numbers, fractions, strings) stay at the Hard value.
const grow = (b, c, k) => (Number.isInteger(c) && Number.isInteger(b) && c >= b ? c + k * Math.max(1, c - b) : c)
export const tier3 = (tier, a, b, c) => {
  if (tier <= 2) return [a, b, c][tier]
  return Array.isArray(c) ? c.map((x, i) => grow(b[i], x, tier - 2)) : grow(b, c, tier - 2)
}
export const cf = (contest, index, name, rating) => ({ contest, index, name, rating })
export const winnerSign = (seat) => (seat === 0 ? 1 : -1)
