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
export const tier3 = (tier, a, b, c) => [a, b, c][tier]
export const cf = (contest, index, name, rating) => ({ contest, index, name, rating })
export const winnerSign = (seat) => (seat === 0 ? 1 : -1)
