import { cf, tier3, sortNum, mex } from './util.js'

const n1 = (s) => s.t
const xor = (a) => a.reduce((x, y) => x ^ y, 0)
const range = (n) => Array.from({ length: n }, (_, i) => i)

// Grundy tables shared across positions. Games with `wins` let the solver skip search: it reports whether
// the player to move wins, here via the Sprague-Grundy theorem.
function memoised(f) {
  const m = new Map()
  const g = (...args) => {
    const k = args.join('|')
    let v = m.get(k)
    if (v === undefined) {
      if (m.size > 2e6) m.clear()
      v = f(g, ...args)
      m.set(k, v)
    }
    return v
  }
  return g
}

// Random tree on n nodes rooted at 0, as a parent array (parent[0] = -1).
function rootedTree(rng, n, maxChildren = 3) {
  const parent = [-1]
  const kids = [0]
  for (let v = 1; v < n; v++) {
    let p
    do p = rng.int(Math.max(0, v - 4), v - 1)
    while (kids[p] >= maxChildren)
    parent.push(p)
    kids[p]++
    kids.push(0)
  }
  return parent
}
const treeEdges = (parent) => parent.flatMap((p, v) => (p < 0 ? [] : [[p, v]]))

// ---- 1037G A Game on Strings ----
const strGrundy = memoised((g, w) => {
  const opts = [...new Set(w)].map((c) => xor(w.split(c).filter(Boolean).map((x) => g(x))))
  return mex(opts)
})
export const gameOnStrings = {
  id: 'game-on-strings',
  title: 'A Game on Strings',
  cf: cf(1037, 'G', 'A Game on Strings', 3200),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'There is a set of strings, starting with one. On each turn a player picks one string and a letter in it, and erases every copy of that letter from that string. The string splits into the pieces between the erased letters, and each piece becomes its own string. A player who cannot move (no strings left) loses. Alice moves first.',
  generate: (rng, tier) => ({ w: [rng.str(tier3(tier, 6, 9, 13), tier3(tier, 'abc', 'abcd', 'abcde'))], t: 0 }),
  turn: n1,
  moves: (s) => [...new Set(s.w)].flatMap((w) => [...new Set(w)].sort().map((c) => [w, c])),
  apply: (s, [w, c]) => {
    const i = s.w.indexOf(w)
    return { w: [...s.w.slice(0, i), ...s.w.slice(i + 1), ...w.split(c).filter(Boolean)], t: 1 - s.t }
  },
  wins: (s) => xor(s.w.map((w) => strGrundy(w))) !== 0,
  key: (s) => `${s.w.slice().sort()}|${s.t}`,
  label: (s, [w, c]) => `erase '${c}' from ${w}`,
  board: 'stringSet',
}

// ---- 1951H Thanos Snap ----
export const thanosSnap = {
  id: 'thanos-snap',
  title: 'Thanos Snap',
  cf: cf(1951, 'H', 'Thanos Snap', 3200),
  roles: ['Alice', 'Bob'],
  kind: 'score',
  scoreLabel: 'the largest number left',
  rules:
    'The array is a permutation of 1…2ᵏ. For t rounds: first Alice may swap any two elements (or pass), then Bob erases the left half or the right half of the array. The score is the largest number left at the end. Alice wants it large and Bob wants it small.',
  generate: (rng, tier) => {
    const k = tier3(tier, 2, 3, 4)
    return { a: rng.shuffle(range(2 ** k).map((i) => i + 1)), r: rng.int(Math.ceil(k / 2), k), ph: 0 }
  },
  turn: (s) => s.ph,
  terminal: (s) => (s.r === 0 ? Math.max(...s.a) : null),
  moves: (s) => {
    if (s.ph === 1) return ['L', 'R']
    const r = ['pass']
    for (let i = 0; i < s.a.length; i++) for (let j = i + 1; j < s.a.length; j++) r.push([i, j])
    return r
  },
  apply: (s, m) => {
    if (s.ph === 1) {
      const h = s.a.length / 2
      return { a: m === 'L' ? s.a.slice(h) : s.a.slice(0, h), r: s.r - 1, ph: 0 }
    }
    const a = s.a.slice()
    if (m !== 'pass') [a[m[0]], a[m[1]]] = [a[m[1]], a[m[0]]]
    return { a, r: s.r, ph: 1 }
  },
  key: (s) => `${s.a}|${s.r}|${s.ph}`,
  label: (s, m) => (m === 'pass' ? 'pass' : m === 'L' ? 'erase the left half' : m === 'R' ? 'erase the right half' : `swap ${s.a[m[0]]} and ${s.a[m[1]]}`),
  board: 'thanosSnap',
}

// ---- 1458E Nim Shortcuts ----
export const nimShortcuts = {
  id: 'nim-shortcuts',
  title: 'Nim Shortcuts',
  cf: cf(1458, 'E', 'Nim Shortcuts', 3100),
  roles: ['First', 'Second'],
  kind: 'win',
  rules:
    'Two heaps of stones. On each turn a player takes any positive number of stones from one heap. Some (x, y) positions are shortcuts: if the heaps are exactly a shortcut before your turn, you lose instantly. A player who cannot move also loses. First moves first.',
  generate: (rng, tier) => {
    const h = tier3(tier, 6, 10, 16)
    const sc = range(tier3(tier, 2, 4, 6)).map(() => [rng.int(0, h), rng.int(0, h)])
    return { x: rng.int(2, h), y: rng.int(2, h), sc, t: 0 }
  },
  turn: n1,
  terminal: (s) => (s.sc.some(([a, b]) => a === s.x && b === s.y) ? (s.t === 0 ? -1 : 1) : null),
  moves: (s) => [...range(s.x).map((i) => ['x', s.x - i]), ...range(s.y).map((i) => ['y', s.y - i])],
  apply: (s, [h, k]) => ({ ...s, [h]: s[h] - k, t: 1 - s.t }),
  key: (s) => `${s.x},${s.y},${s.t}`,
  label: (s, [h, k]) => `take ${k} from heap ${h === 'x' ? 1 : 2}`,
  board: 'nim2',
}

// ---- 1076G Array Game ----
export const arrayGame = {
  id: 'array-game-chip',
  title: 'Array Game',
  cf: cf(1076, 'G', 'Array Game', 3000),
  roles: ['First', 'Second'],
  kind: 'win',
  rules:
    'A chip starts on the first cell of the array b, and b₁ has already been decreased by 1. On each turn, with the chip on cell x, the player moves it to a cell y with x ≤ y ≤ x + m and b_y > 0, then decreases b_y by 1. Staying on the same cell is allowed. A player who cannot move loses. First moves first.',
  generate: (rng, tier) => {
    const b = rng.array(tier3(tier, 3, 4, 5), 1, tier3(tier, 3, 4, 5))
    b[0] -= 1
    return { b, x: 0, m: rng.int(1, 2), t: 0 }
  },
  turn: n1,
  moves: (s) => range(s.m + 1).map((d) => s.x + d).filter((y) => y < s.b.length && s.b[y] > 0),
  apply: (s, y) => {
    const b = s.b.slice()
    b[y]--
    return { b, x: y, m: s.m, t: 1 - s.t }
  },
  key: (s) => `${s.b}|${s.x}|${s.t}`,
  label: (s, y) => (y === s.x ? `stay on cell ${y + 1}` : `move to cell ${y + 1}`),
  board: 'arrayGame',
}

// ---- 2115D Gellyfish and Forget-Me-Not ----
export const gellyfish = {
  id: 'gellyfish-forget-me-not',
  title: 'Gellyfish and Forget-Me-Not',
  cf: cf(2115, 'D', 'Gellyfish and Forget-Me-Not', 2900),
  roles: ['Flower', 'Gellyfish'],
  kind: 'score',
  scoreLabel: 'the final x',
  rules:
    'x starts at 0. In round i the player named by cᵢ sets x to x ⊕ aᵢ or x ⊕ bᵢ (⊕ is bitwise XOR). After the last round, Flower wants x as large as possible and Gellyfish wants it as small as possible.',
  generate: (rng, tier) => {
    const n = tier3(tier, 4, 6, 8)
    const hi = 2 ** tier3(tier, 3, 4, 5) - 1
    return { a: rng.array(n, 0, hi), b: rng.array(n, 0, hi), c: rng.str(n, '01'), i: 0, x: 0 }
  },
  turn: (s) => (s.c[s.i] === '1' ? 0 : 1),
  terminal: (s) => (s.i === s.a.length ? s.x : null),
  moves: () => ['a', 'b'],
  apply: (s, m) => ({ ...s, i: s.i + 1, x: s.x ^ s[m][s.i] }),
  key: (s) => `${s.i},${s.x}`,
  label: (s, m) => `x ⊕= ${m}${s.i + 1} = ${s[m][s.i]}`,
  board: 'gelly',
}

// ---- 536D Tavas in Kansas ----
function kansasRanks(n, edges, src) {
  const d = Array(n).fill(Infinity)
  d[src] = 0
  for (let it = 0; it < n; it++) for (const [u, v, w] of edges) {
    if (d[u] + w < d[v]) d[v] = d[u] + w
    if (d[v] + w < d[u]) d[u] = d[v] + w
  }
  const levels = sortNum([...new Set(d)])
  return { d, rank: d.map((x) => levels.indexOf(x)), levels }
}
const unused = (s, c) => s.rs[c] >= s.i && s.rt[c] >= s.j
export const tavasKansas = {
  id: 'tavas-in-kansas',
  title: 'Tavas in Kansas',
  cf: cf(536, 'D', 'Tavas in Kansas', 2900),
  roles: ['Tavas', 'Nafas'],
  kind: 'score',
  scoreLabel: "Tavas's score minus Nafas's",
  rules:
    "Cities have values (some negative), and roads have lengths. Tavas lives in one city and Nafas in another. On each turn a player picks a distance x and scores every unclaimed city within distance x of their own city. Each city can only be scored once, and each move must claim at least one new city. The game ends when every city is claimed. Tavas moves first. The score here is Tavas's total minus Nafas's: Tavas wants it high and Nafas wants it low.",
  generate: (rng, tier) => {
    const n = tier3(tier, 5, 7, 9)
    const edges = []
    for (let v = 1; v < n; v++) edges.push([rng.int(0, v - 1), v, rng.int(1, 3)])
    for (let e = 0; e < tier3(tier, 1, 2, 3); e++) {
      const u = rng.int(0, n - 1)
      const v = rng.int(0, n - 1)
      if (u !== v) edges.push([u, v, rng.int(1, 3)])
    }
    const [st, nt] = rng.shuffle(range(n)).slice(0, 2)
    const a = kansasRanks(n, edges, st)
    const b = kansasRanks(n, edges, nt)
    return { n, edges, p: rng.array(n, -3, 6), st, nt, ds: a.levels, dt: b.levels, rs: a.rank, rt: b.rank, i: 0, j: 0, sc: 0, own: Array(n).fill(-1), t: 0 }
  },
  turn: n1,
  moves: (s) => {
    const [cur, rank, len] = s.t === 0 ? [s.i, s.rs, s.ds.length] : [s.j, s.rt, s.dt.length]
    const r = []
    for (let k = cur + 1; k <= len; k++) if (range(s.n).some((c) => unused(s, c) && rank[c] < k)) r.push(k)
    return r
  },
  outcome: (s) => s.sc,
  apply: (s, k) => {
    const rank = s.t === 0 ? s.rs : s.rt
    const own = s.own.slice()
    let gain = 0
    for (let c = 0; c < s.n; c++)
      if (unused(s, c) && rank[c] < k) {
        gain += s.p[c]
        own[c] = s.t
      }
    return { ...s, own, sc: s.sc + (s.t === 0 ? gain : -gain), i: s.t === 0 ? k : s.i, j: s.t === 1 ? k : s.j, t: 1 - s.t }
  },
  key: (s) => `${s.i},${s.j},${s.sc},${s.t}`,
  label: (s, k) => `x = ${(s.t === 0 ? s.ds : s.dt)[k - 1]}`,
  board: 'kansas',
}

// ---- 2027E1 Bit Game ----
const bitGrundy = memoised((g, x, a) => {
  const opts = []
  for (let d = x; d > 0; d = (d - 1) & x) if (d <= a) opts.push(g(x - d, a))
  return mex(opts)
})
export const bitGame = {
  id: 'bit-game',
  title: 'Bit Game',
  cf: cf(2027, 'E1', 'Bit Game (Easy Version)', 2800),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'Each pile i has xᵢ stones and a limit aᵢ. A player may take d stones from pile i if 1 ≤ d ≤ aᵢ and d is a submask of xᵢ (x & d = d, so d only uses bits that are set in x). A player who cannot move loses. Alice moves first.',
  generate: (rng, tier) => {
    const hi = 2 ** tier3(tier, 3, 4, 5) - 1
    const n = tier3(tier, 2, 3, 4)
    return { x: rng.array(n, 1, hi), a: rng.array(n, 1, hi), t: 0 }
  },
  turn: n1,
  moves: (s) =>
    s.x.flatMap((x, i) => {
      const r = []
      for (let d = x; d > 0; d = (d - 1) & x) if (d <= s.a[i]) r.push([i, d])
      return r.reverse()
    }),
  apply: (s, [i, d]) => ({ ...s, x: s.x.map((x, j) => (j === i ? x - d : x)), t: 1 - s.t }),
  wins: (s) => xor(s.x.map((x, i) => bitGrundy(x, s.a[i]))) !== 0,
  key: (s) => `${s.x}|${s.a}|${s.t}`,
  label: (s, [i, d]) => `take ${d} from pile ${i + 1}`,
  board: 'bitGame',
}

// ---- 2013F1 Game in Tree ----
export const gameInTree = {
  id: 'game-in-tree',
  title: 'Game in Tree',
  cf: cf(2013, 'F1', 'Game in Tree (Easy Version)', 2700),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'Alice starts on vertex 1 and Bob on another vertex. On each turn the player moves from their vertex to a neighbouring vertex that nobody has visited yet. The first player who cannot move loses. Alice moves first.',
  generate: (rng, tier) => {
    const n = tier3(tier, 7, 10, 13)
    const edges = treeEdges(rootedTree(rng, n))
    const b = rng.int(1, n - 1)
    return { n, edges, pos: [0, b], vis: [0, b], t: 0 }
  },
  turn: n1,
  moves: (s) => {
    const u = s.pos[s.t]
    return s.edges.flatMap(([a, b]) => (a === u ? [b] : b === u ? [a] : [])).filter((w) => !s.vis.includes(w)).sort((a, b) => a - b)
  },
  apply: (s, w) => ({ ...s, pos: s.t === 0 ? [w, s.pos[1]] : [s.pos[0], w], vis: [...s.vis, w], t: 1 - s.t }),
  key: (s) => `${s.pos}|${sortNum(s.vis)}|${s.t}`,
  label: (s, w) => `move to ${w + 1}`,
  board: 'treeWalk',
}

// ---- 1498F Christmas Game ----
// Staircase Nim: only presents on nodes with ⌊depth / k⌋ odd matter.
export const christmasGame = {
  id: 'christmas-game',
  title: 'Christmas Game',
  cf: cf(1498, 'F', 'Christmas Game', 2500),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    "A rooted tree (root at the top) has aᵢ presents on node i. On each turn a player picks a node i whose depth is at least k, takes m ≥ 1 of its presents, and moves them to i's k-th ancestor (k steps up). A player who cannot move loses. Alice moves first.",
  generate: (rng, tier) => {
    const n = tier3(tier, 5, 7, 10)
    const parent = rootedTree(rng, n, 2)
    const depth = parent.map(() => 0)
    for (let v = 1; v < n; v++) depth[v] = depth[parent[v]] + 1
    return { parent, depth, k: rng.int(1, 2), a: rng.array(n, 0, tier3(tier, 2, 3, 4)), t: 0 }
  },
  turn: n1,
  moves: (s) => s.a.flatMap((x, i) => (s.depth[i] >= s.k ? range(x).map((m) => [i, m + 1]) : [])),
  apply: (s, [i, m]) => {
    let j = i
    for (let d = 0; d < s.k; d++) j = s.parent[j]
    const a = s.a.slice()
    a[i] -= m
    a[j] += m
    return { ...s, a, t: 1 - s.t }
  },
  wins: (s) => xor(s.a.filter((_, i) => Math.floor(s.depth[i] / s.k) % 2 === 1)) !== 0,
  key: (s) => `${s.a}|${s.t}`,
  label: (s, [i, m]) => `move ${m} from node ${i + 1}`,
  board: 'christmas',
}

// ---- 1312F Attack on Red Kingdom ----
// Last attack type per castle: 0 none or mixed, 1 infantry, 2 cavalry.
const castleGrundy = memoised((g, a, last, x, y, z) => {
  if (a <= 0) return 0
  const opts = [g(Math.max(0, a - x), 0, x, y, z)]
  if (last !== 1) opts.push(g(Math.max(0, a - y), 1, x, y, z))
  if (last !== 2) opts.push(g(Math.max(0, a - z), 2, x, y, z))
  return mex(opts)
})
const ATTACKS = ['mixed', 'infantry', 'cavalry']
export const redKingdom = {
  id: 'attack-on-red-kingdom',
  title: 'Attack on Red Kingdom',
  cf: cf(1312, 'F', 'Attack on Red Kingdom', 2500),
  roles: ['White King', 'Black King'],
  kind: 'win',
  rules:
    'Castles have defenders. Each attack targets a castle with at least one defender left. A mixed attack kills x defenders, an infantry attack kills y and a cavalry attack kills z (never below 0). An infantry attack cannot follow an infantry attack on the same castle, and the same goes for cavalry. Mixed attacks are always allowed. The king who makes the last attack wins. The White King attacks first.',
  generate: (rng, tier) => {
    const hi = tier3(tier, 5, 6, 7)
    return {
      a: rng.array(tier3(tier, 2, 3, 4), 3, tier3(tier, 8, 14, 22)),
      xyz: [rng.int(1, hi), rng.int(1, hi), rng.int(1, hi)],
      last: null,
      t: 0,
    }
  },
  turn: n1,
  moves: (s) => {
    const last = s.last || s.a.map(() => 0)
    return s.a.flatMap((a, i) => (a > 0 ? [0, 1, 2].filter((k) => k === 0 || last[i] !== k).map((k) => [i, k]) : []))
  },
  apply: (s, [i, k]) => {
    const last = (s.last || s.a.map(() => 0)).slice()
    last[i] = k
    return { ...s, a: s.a.map((a, j) => (j === i ? Math.max(0, a - s.xyz[k]) : a)), last, t: 1 - s.t }
  },
  wins: (s) => xor(s.a.map((a, i) => castleGrundy(a, s.last ? s.last[i] : 0, ...s.xyz))) !== 0,
  key: (s) => `${s.a}|${s.last}|${s.t}`,
  label: (s, [i, k]) => `${ATTACKS[k]} attack on castle ${i + 1}`,
  board: 'redKingdom',
}
