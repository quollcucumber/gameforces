import * as b1 from './batch1.js'
import * as b2 from './batch2.js'
import * as b3 from './batch3.js'

const all = [...Object.values(b1), ...Object.values(b2), ...Object.values(b3)].filter((g) => g && g.id && g.cf)

export const GAMES = all.sort((a, b) => a.cf.rating - b.cf.rating || a.title.localeCompare(b.title))
export const GAME_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]))
export const cfUrl = (g) => `https://codeforces.com/problemset/problem/${g.cf.contest}/${g.cf.index}`
