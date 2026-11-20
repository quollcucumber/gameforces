export const START_RATING = 1200
export const MAX_DELTA = 64

export function kFactor(games) {
  return games < 10 ? 64 : 32
}

export function expected(r, opp) {
  return 1 / (1 + 10 ** ((opp - r) / 400))
}

export function ratingDelta(r, opp, score, games) {
  const d = Math.round(kFactor(games) * (score - expected(r, opp)))
  return Math.max(-MAX_DELTA, Math.min(MAX_DELTA, d))
}

export function scoreOf(result) {
  return result === 'win' ? 1 : result === 'draw' ? 0.5 : 0
}
