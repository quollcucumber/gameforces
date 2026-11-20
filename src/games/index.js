import * as b1 from './batch1.js'
import * as b2 from './batch2.js'
import * as b3 from './batch3.js'
import * as b4 from './batch4.js'
import * as b5 from './batch5.js'
import MAX_TIERS from './tiers.js'

const all = [...Object.values(b1), ...Object.values(b2), ...Object.values(b3), ...Object.values(b4), ...Object.values(b5)].filter((g) => g && g.id && g.cf)

export const GAMES = all.sort((a, b) => a.cf.rating - b.cf.rating || a.title.localeCompare(b.title))
export const GAME_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]))
export const cfUrl = (g) => `https://codeforces.com/problemset/problem/${g.cf.contest}/${g.cf.index}`

// MAX_TIERS holds the biggest size level each game solves quickly. Expert sits halfway there and Insane at the top.
for (const g of GAMES) {
  const top = MAX_TIERS[g.id] ?? 2
  g.levels = top <= 2 ? [] : top === 3 ? [3] : [2 + Math.ceil((top - 2) / 2), top]
}
export const maxTier = (game) => 2 + game.levels.length
