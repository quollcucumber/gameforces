import { cf, tier3, sortNum, winnerSign } from './util.js'
import { randomTree } from './batch1.js'

const n1 = (s) => s.t

export const chipGame3500 = {
  id: 'chip-game-3500',
  title: 'Chip Game (a vs b)',
  cf: cf(1033, 'G', 'Chip Game', 3500),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'There are piles of chips. Alice has a number a and Bob has a number b. On her turn Alice removes exactly a chips from a pile that has at least a chips. On his turn Bob removes exactly b chips from a pile that has at least b. A player who cannot move loses. The starting player is shown with the position.',
  generate: (rng, tier) => {
    const m = tier3(tier, 4, 5, 6)
    const ab = [rng.int(1, m), rng.int(1, m)]
    return { a: rng.array(tier3(tier, 2, 3, 4), 1, tier3(tier, 10, 14, 18)), ab, t: rng.int(0, 1) }
  },
  turn: n1,
  moves: (s) => [...new Set(s.a.filter((x) => x >= s.ab[s.t]))],
  apply: (s, v) => {
    const a = s.a.slice()
    a[a.indexOf(v)] -= s.ab[s.t]
    return { a, ab: s.ab, t: 1 - s.t }
  },
  key: (s) => `${sortNum(s.a)}|${s.ab}|${s.t}`,
  label: (s, v) => `take ${s.ab[s.t]} from a pile of ${v}`,
  board: 'chipPiles',
}

// Taxes are capped at H so that the "set any value" part of a move has finitely many options.
const H = 2
function* assignments(k) {
  const cur = Array(k).fill(0)
  for (;;) {
    yield cur.slice()
    let i = 0
    while (i < k && cur[i] === H) cur[i++] = 0
    if (i === k) return
    cur[i]++
  }
}
export const electionPromises = {
  id: 'election-promises',
  title: 'Election Promises',
  cf: cf(1149, 'E', 'Election Promises', 3200),
  roles: ['Wrong Answer Party', 'Time Limit Exceeded Party'],
  kind: 'win',
  rules: `Cities are joined by one-way roads with no cycles, and each city has a tax. On each turn a party holds a convention in a city v. It must lower the tax in v, and it may set the tax of every city one road away from v to any value. In this version every tax is between 0 and ${H}. The party that holds the last convention wins. Wrong Answer Party moves first.`,
  generate: (rng, tier) => {
    const n = tier3(tier, 5, 6, 7)
    const perm = rng.shuffle(Array.from({ length: n }, (_, i) => i))
    const out = Array.from({ length: n }, () => [])
    const edges = []
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if (out[perm[i]].length < 2 && rng.next() < 0.35) {
          out[perm[i]].push(perm[j])
          edges.push([perm[i], perm[j]])
        }
    return { n, edges, out, h: rng.array(n, 0, H), t: 0 }
  },
  turn: n1,
  moves: (s) => {
    const r = []
    for (let v = 0; v < s.n; v++)
      for (let x = 0; x < s.h[v]; x++) for (const set of assignments(s.out[v].length)) r.push([v, x, set])
    return r
  },
  apply: (s, [v, x, set]) => {
    const h = s.h.slice()
    h[v] = x
    s.out[v].forEach((u, i) => (h[u] = set[i]))
    return { ...s, h, t: 1 - s.t }
  },
  key: (s) => `${s.h.join('')}|${s.t}`,
  label: (s, [v, x, set]) =>
    `city ${v + 1} → ${x}` + s.out[v].map((u, i) => `, ${u + 1} → ${set[i]}`).join(''),
  board: 'election',
}

const SEMI = [2, 3, 4, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23, 25]
export const tricolore = {
  id: 'tricolore-recreation',
  title: 'New Year and the Tricolore Recreation',
  cf: cf(1091, 'H', 'New Year and the Tricolore Recreation', 3200),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'Each row has a blue, a white and a red token in that order from left to right, and no two can share a cell. A move uses a number k that is a prime or a product of two primes (2, 3, 4, 5, 6, 7, 9, 10, …), and k must not equal the forbidden number f. Alice moves a blue token k cells right, or moves the blue and white tokens of one row k cells right together. Bob moves a red token k cells left, or moves the white and red tokens of one row k cells left together. A player who cannot move loses. The starting player is shown with the position.',
  generate: (rng, tier) => {
    const rows = Array.from({ length: tier3(tier, 1, 2, 2) }, () => {
      const g = tier3(tier, 8, 11, 16)
      const b = 0
      const w = b + 1 + rng.int(0, g)
      return [b, w, w + 1 + rng.int(0, g)]
    })
    return { rows, f: rng.pick([2, 3, 4, 5, 6]), t: rng.int(0, 1) }
  },
  turn: n1,
  moves: (s) => {
    const r = []
    s.rows.forEach(([b, w, rr], i) => {
      for (const k of SEMI) {
        if (k === s.f) continue
        if (s.t === 0) {
          if (b + k < w) r.push([i, 0, k])
          if (w + k < rr) r.push([i, 1, k])
        } else {
          if (rr - k > w) r.push([i, 0, k])
          if (w - k > b) r.push([i, 1, k])
        }
      }
    })
    return r
  },
  apply: (s, [i, both, k]) => {
    const rows = s.rows.map((x) => x.slice())
    const row = rows[i]
    if (s.t === 0) {
      row[0] += k
      if (both) row[1] += k
    } else {
      row[2] -= k
      if (both) row[1] -= k
    }
    return { rows, f: s.f, t: 1 - s.t }
  },
  key: (s) => `${s.rows.map(([b, w, r]) => `${w - b},${r - w}`).sort()}|${s.f}|${s.t}`,
  label: (s, [i, both, k]) =>
    `row ${i + 1}: ${s.t === 0 ? (both ? 'blue + white' : 'blue') + ` → ${k}` : (both ? 'white + red' : 'red') + ` ← ${k}`}`,
  board: 'tricolore',
}

function makesPath(n, adj, col, v) {
  const c = col[v]
  const same = (u) => col[u] === c
  if (adj[v].filter(same).length >= 2) return true
  return adj[v].some((u) => same(u) && adj[u].filter(same).length >= 2)
}
export const treeTacToe = {
  id: 'tree-tac-toe',
  title: 'Tree-Tac-Toe',
  cf: cf(1110, 'G', 'Tree-Tac-Toe', 3100),
  roles: ['White', 'Black'],
  kind: 'win',
  rules:
    'Tic-tac-toe on a tree. Some vertices start out white. On each turn a player paints one uncoloured vertex in their own colour. The first player to own a path of three vertices in their colour wins. If every vertex is coloured and nobody has won, it is a draw. White moves first.',
  generate: (rng, tier) => {
    const n = tier3(tier, 7, 9, 11)
    const edges = randomTree(rng, n)
    const adj = Array.from({ length: n }, () => [])
    for (const [a, b] of edges) {
      adj[a].push(b)
      adj[b].push(a)
    }
    const col = Array(n).fill('N')
    for (const v of rng.shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, rng.int(0, Math.floor(n / 4)))) {
      col[v] = 'W'
      if (makesPath(n, adj, col, v)) col[v] = 'N'
    }
    return { n, edges, adj, col: col.join(''), t: 0, win: null }
  },
  turn: n1,
  terminal: (s) => (s.win !== null ? s.win : s.col.includes('N') ? null : 0),
  moves: (s) => [...s.col].flatMap((c, i) => (c === 'N' ? [i] : [])),
  apply: (s, v) => {
    const col = [...s.col]
    col[v] = s.t === 0 ? 'W' : 'B'
    return { ...s, col: col.join(''), t: 1 - s.t, win: makesPath(s.n, s.adj, col, v) ? winnerSign(s.t) : null }
  },
  key: (s) => `${s.col}|${s.win}`,
  label: (s, v) => `paint ${v + 1}`,
  board: 'treeTacToe',
}

export const choosingCarrot = {
  id: 'choosing-carrot',
  title: 'Choosing Carrot',
  cf: cf(794, 'E', 'Choosing Carrot', 2800),
  roles: ['Oleg', 'Igor'],
  kind: 'score',
  scoreLabel: 'the juiciness of the last carrot',
  rules:
    'Carrots lie in a row. Players take turns eating a carrot from either end, and the game ends when one carrot is left. Oleg wants that carrot to be as juicy as possible and Igor wants it as dry as possible. Before the game starts, Oleg sneaks in k extra moves while Igor is away. Then Oleg moves first.',
  generate: (rng, tier) => {
    const n = tier3(tier, 6, 9, 13)
    return { a: rng.array(n, 1, 20), k: rng.int(0, n - 3), t: 0 }
  },
  turn: (s) => (s.k > 0 ? 0 : s.t),
  moves: (s) => (s.a.length > 1 ? ['L', 'R'] : []),
  apply: (s, m) => ({
    a: m === 'L' ? s.a.slice(1) : s.a.slice(0, -1),
    k: Math.max(0, s.k - 1),
    t: s.k > 0 ? 0 : 1 - s.t,
  }),
  outcome: (s) => s.a[0],
  label: (s, m) => (m === 'L' ? `eat left (${s.a[0]})` : `eat right (${s.a[s.a.length - 1]})`),
  board: 'carrots',
}

export const xorBreak = {
  id: 'xor-break-game',
  title: 'XOR Break — Game Version',
  cf: cf(1934, 'D2', 'XOR Break — Game Version', 2400),
  roles: ['First', 'Second'],
  kind: 'win',
  rules:
    'The game starts with a number p. The player to move breaks p into p₁ and p₂ with 0 < p₁, p₂ < p and p₁ ⊕ p₂ = p. The opponent picks one of the two numbers, and then that opponent must break it. A player who cannot break their number loses. First breaks first.',
  generate: (rng, tier) => ({ p: rng.int(tier3(tier, 8, 32, 64), tier3(tier, 31, 63, 127)), pair: null, t: 0 }),
  turn: n1,
  moves: (s) => {
    if (s.pair) return [0, 1]
    const r = []
    for (let a = 1; a < s.p; a++) {
      const b = a ^ s.p
      if (b > a && b < s.p) r.push(a)
    }
    return r
  },
  apply: (s, m) => (s.pair ? { p: s.pair[m], pair: null, t: s.t } : { p: s.p, pair: [m, m ^ s.p], t: 1 - s.t }),
  key: (s) => (s.pair ? `${s.pair}|${s.t}` : `${s.p}|${s.t}`),
  label: (s, m) => (s.pair ? `take ${s.pair[m]}` : `break into ${m} ⊕ ${m ^ s.p}`),
  board: 'xorBreak',
}

export const removingGraph = {
  id: 'removing-graph',
  title: 'Removing Graph',
  cf: cf(1823, 'E', 'Removing Graph', 2500),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'The graph is a set of disjoint cycles, so every vertex has degree 2. On each turn a player erases k connected vertices, where l ≤ k ≤ r. Erasing part of a cycle leaves a path, and erasing the middle of a path splits it in two. A player who cannot move loses. Alice moves first.',
  generate: (rng, tier) => {
    const l = rng.int(1, 3)
    const cyc = rng.array(tier3(tier, 1, 2, 3), 3, tier3(tier, 7, 9, 10))
    return { cyc, path: [], lr: [l, l + rng.int(1, 3)], t: 0 }
  },
  turn: n1,
  moves: (s) => {
    const [l, r] = s.lr
    const out = []
    for (const c of new Set(s.cyc)) for (let k = l; k <= Math.min(r, c); k++) out.push(['c', c, k, 0])
    for (const p of new Set(s.path))
      for (let k = l; k <= Math.min(r, p); k++) for (let a = 0; 2 * a <= p - k; a++) out.push(['p', p, k, a])
    return out
  },
  apply: (s, [type, len, k, a]) => {
    const cyc = s.cyc.slice()
    const path = s.path.slice()
    if (type === 'c') {
      cyc.splice(cyc.indexOf(len), 1)
      if (len > k) path.push(len - k)
    } else {
      path.splice(path.indexOf(len), 1)
      path.push(a, len - k - a)
    }
    return { cyc, path: path.filter((x) => x >= s.lr[0]), lr: s.lr, t: 1 - s.t }
  },
  key: (s) => `${sortNum(s.cyc)}|${sortNum(s.path)}|${s.lr}|${s.t}`,
  label: (s, [type, len, k, a]) =>
    type === 'c'
      ? `cycle of ${len}: erase ${k}${len > k ? ` → path of ${len - k}` : ''}`
      : `path of ${len}: erase ${k}, leaving ${a} + ${len - k - a}`,
  board: 'removingGraph',
}
