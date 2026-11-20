// Describes how each board type is drawn. A view returns rows:
//   { label, tiles, hl, dim }  a row of tiles (hl/dim are index lists)
//   { label, value }           a single labelled value
//   { grid, label }            a 2D grid of cell strings
//   { graph: { n, edges, hl, dim, layout } }
const t = (label, tiles, extra = {}) => ({ label, tiles: [...tiles], ...extra })
const v = (label, value) => ({ label, value: String(value) })
const range = (n) => Array.from({ length: n }, (_, i) => i)
const bits = (mask, n) => range(n).filter((i) => (mask >> i) & 1)

const ATTACK_NAMES = ['free', 'after infantry', 'after cavalry']
const treeGraph = (parent, extra = {}) => ({ graph: { n: parent.length, edges: parent.flatMap((p, v) => (p < 0 ? [] : [[p, v]])), layout: 'tree', ...extra } })

export const VIEWS = {
  stringSet: (s) => [t('Strings', s.w.length ? s.w : ['—'])],
  thanosSnap: (s) => [t('Array', s.a), v('Rounds left', s.r), v('Next', s.ph === 0 ? 'Alice may swap' : 'Bob erases a half')],
  nim2: (s) => [v('Heaps', `${s.x} and ${s.y}`), t('Shortcuts (x, y)', s.sc.map(([a, b]) => `${a},${b}`))],
  arrayGame: (s) => [t('b', s.b, { hl: [s.x] }), v('m', s.m)],
  gelly: (s) => [
    t('a', s.a, { hl: [s.i] }),
    t('b', s.b, { hl: [s.i] }),
    t('Chooses (F Flower, G Gellyfish)', [...s.c].map((ch) => (ch === '1' ? 'F' : 'G')), { hl: [s.i] }),
    v('x', `${s.x} (binary ${s.x.toString(2)})`),
  ],
  kansas: (s) => [
    { graph: { n: s.n, edges: s.edges.map(([a, b, w]) => [a, b, String(w)]), hl: range(s.n).filter((c) => s.own[c] === 0), hl2: range(s.n).filter((c) => s.own[c] === 1), layout: 'circle' } },
    t('City values', s.p),
    v('Tavas lives in / Nafas lives in', `${s.st + 1} / ${s.nt + 1}`),
    v('Claimed', 'gold = Tavas, blue = Nafas'),
    v("Tavas − Nafas", s.sc),
  ],
  bitGame: (s) => [t('Stones x', s.x), t('Limit a', s.a), t('x in binary', s.x.map((x) => x.toString(2)))],
  treeWalk: (s) => [
    { graph: { n: s.n, edges: s.edges, layout: 'tree', hl: s.vis.filter((_, i) => i % 2 === 0), hl2: s.vis.filter((_, i) => i % 2 === 1) } },
    v('Alice is on / Bob is on', `${s.pos[0] + 1} / ${s.pos[1] + 1}`),
  ],
  christmas: (s) => [treeGraph(s.parent), t('Presents on node 1, 2, …', s.a), t('Depth', s.depth), v('k', s.k)],
  redKingdom: (s) => [t('Defenders', s.a), t('Last attack', s.a.map((_, i) => ATTACK_NAMES[s.last ? s.last[i] : 0])), v('x / y / z', s.xyz.join(' / '))],

  integers: (s) => [v('n', s.n), v('Moves made', `${s.k} / 10`)],
  subtract: (s) => [v('n', s.n), ...(s.ab ? [v('Allowed', s.ab.join(' or '))] : [])],
  strip: (s) => [t('Strip', range(s.n + 1).map((i) => (i === s.n ? '●' : i)), { hl: [s.n] }), v('k', s.k)],
  numberOps: (s) => [v('n', s.n)],
  divisor: (s) => [v('Number', s.q)],
  chest: (s, g) => [v('Coins in chest', s.n), v(`${g.roles[0]} has`, s.got)],
  pairDelete: (s) => [t('String', s.s)],
  blockDelete: (s, g) => [t('String', s.s), v(`${g.roles[0]} / ${g.roles[1]} scores`, s.sc.join(' / '))],
  palindrome: (s, g) => [t('String', s.s), v('Reversed last turn', s.rev ? 'yes' : 'no'), v(`Dollars paid (${g.roles.join(' / ')})`, s.cost.join(' / '))],
  wallets: (s, g) => [v(`Wallets (${g.roles.join(' / ')})`, s.w.join(' / '))],
  frogs: (s) => [t('Lilypads', range(s.n).map((i) => (s.p[0] === i + 1 ? 'A' : s.p[1] === i + 1 ? 'B' : '·')), { hl: [s.p[s.t] - 1] })],
  letters: (s) => [t('Letters', s.s)],
  numbers: (s) => [
    t('Numbers', s.a),
    ...(Array.isArray(s.sc) ? [v('Scores', s.sc.join(' / '))] : s.sc !== undefined ? [v('Score', s.sc)] : []),
    ...(s.k !== undefined ? [v('k', s.k)] : []),
    ...(s.mine !== undefined ? [v("Parity of Alice's sum", s.mine ? 'odd' : 'even')] : []),
    ...(s.c ? [t("Alice's array c", s.c)] : []),
    ...(s.last !== undefined && s.last !== null ? [v('Alice just erased', s.last)] : []),
  ],
  xor: (s) => [t('Numbers', s.a), v('XORs (Koa / friend)', s.sc.join(' / '))],
  piles: (s) => [t('Piles', s.a)],
  piles1: (s) => [t('Piles', s.a)],
  allPiles: (s) => [t('Piles', s.a)],
  thanos: (s) => [t('Piles', s.a)],
  gcdPiles: (s) => [t('Piles', s.a)],
  stoned: (s) => [t('Piles', s.a, { dim: s.last >= 0 ? [s.last] : [] })],
  stones: (s) => [t('Piles', s.a), ...s.a.map((_, i) => v(`Used on pile ${i + 1}`, (s.used[i] || []).join(', ') || '—'))],
  circle: (s) => [t('Piles (circle)', s.a, { hl: [s.i] })],
  coins: (s) => [t('Coins (circle)', s.s)],
  digits: (s) => [t('Digits', s.d), v('Marked', s.m || '—')],
  division: (s) => [t('Array', s.a, { hl: s.pick }), v('k', s.k)],
  swap: (s) => [t('Array', s.a, { hl: [0] })],
  removals: (s, g) => [t(g.roles[0], s.arr[0]), t(g.roles[1], s.arr[1])],
  marbles: (s, g) => [t(`${g.roles[0]}'s marbles`, s.a), t(`${g.roles[1]}'s marbles`, s.b)],
  board: (s) => [t('Board', s.a)],
  arrayEnds: (s) => [t('Array', s.a, { dim: s.a.map((_, i) => i).filter((i) => i < s.l || i > s.r) }), v('Last number', s.last || '—')],
  letterPicking: (s, g) => [t('String', s.s), v(g.roles[0], s.own[0] || '—'), v(g.roles[1], s.own[1] || '—')],
  stringGame: (s) => [t('String', s.s, { dim: [...s.used].map(Number) })],
  ticket: (s) => [t('Ticket', s.d, { split: s.d.length / 2 })],
  pie: (s, g) => [t('Slices', s.p, { dim: range(s.i) }), v(`Eaten (${g.roles.join(' / ')})`, s.got.join(' / ')), v('Decider token', g.roles[s.dec])],
  words: (s) => [t('Words', s.words), v('Built so far', s.w || '(empty)')],
  differences: (s) => [t('Set', s.a)],
  logs: (s) => [t('Logs', s.a), ...(s.k ? [v('Min part length', s.k)] : [])],
  lieges: (s) => [t('Piles', s.a), v('k', s.k)],
  stickers: (s) => [t('Stickers', s.a), v('Score difference', s.d)],
  cutString: (s) => [t('Pieces', s.p.length ? s.p : ['(none left)'])],
  dots: (s, g) => [t('String', s.s), v(`a (${g.roles[0]}) / b (${g.roles[1]})`, s.ab.join(' / '))],
  colouring: (s) => [t('Cells', s.s)],
  permutation: (s) => [t('Cells', s.a, { hl: [s.p] })],
  matrix: (s) => [{ grid: s.g.map((r) => r.map((x) => (x === 1 ? '■' : x === 2 ? '✕' : ''))), label: 'Matrix (■ claimed, ✕ given)' }],
  chip: (s) => [{ grid: range(s.n).map((r) => range(s.m).map((c) => (r === s.r && c === s.c ? '●' : ''))), label: `${s.n} × ${s.m} board${s.k ? `, k = ${s.k}` : ''}` }],
  knights: (s) => [{ grid: range(s.n).map((r) => range(s.n).map((c) => ((s.k >> (r * s.n + c)) & 1 ? '♞' : ''))), label: `${s.n} × ${s.n} board` }],
  ttt: (s) => [{ grid: range(3).map((r) => range(3).map((c) => (s.b[r * 3 + c] === '.' ? '' : s.b[r * 3 + c]))), label: 'Tic-tac-toe' }],
  stoneTree: (s) => [{ graph: { n: s.n, edges: s.edges, hl: [s.p], dim: bits(s.vis, s.n).filter((x) => x !== s.p), layout: 'tree' } }],
  leaves: (s) => [{ graph: { n: s.n, edges: s.edges.filter(([a, b]) => !((s.gone >> a) & 1) && !((s.gone >> b) & 1)), hl: [s.x], dim: bits(s.gone, s.n), layout: 'tree' } }],
  dag: (s) => [
    { graph: { n: s.n, edges: s.edges, hl: [s.p[0]], hl2: [s.p[1]], layout: 'circle', directed: true } },
    v('Marbles (Max / Lucas)', `${s.p[0] + 1} / ${s.p[1] + 1}`),
    v('Last letter', s.last),
  ],
  chipPiles: (s, g) => [t('Piles', s.a), v(`a (${g.roles[0]}) / b (${g.roles[1]})`, s.ab.join(' / '))],
  election: (s) => [{ graph: { n: s.n, edges: s.edges, layout: 'circle', directed: true } }, t('Taxes by city', s.h)],
  tricolore: (s) => {
    const lo = Math.min(...s.rows.map((r) => r[0]))
    const hi = Math.max(...s.rows.map((r) => r[2]))
    const grid = s.rows.map(([b, w, r]) => range(hi - lo + 1).map((i) => (i + lo === b ? 'B' : i + lo === w ? 'W' : i + lo === r ? 'R' : '')))
    return [{ grid, label: 'Rows (B blue, W white, R red)' }, v('Forbidden k', s.f)]
  },
  treeTacToe: (s) => [
    { graph: { n: s.n, edges: s.edges, hl: range(s.n).filter((i) => s.col[i] === 'W'), hl2: range(s.n).filter((i) => s.col[i] === 'B'), layout: 'tree' } },
    v('Colours', 'gold = White, blue = Black'),
  ],
  carrots: (s) => [t('Carrots', s.a), v("Oleg's extra moves left", s.k)],
  xorBreak: (s) => (s.pair ? [t('Pick one to break next', s.pair)] : [v('Number to break', `${s.p} (binary ${s.p.toString(2)})`)]),
  removingGraph: (s) => [t('Cycles', s.cyc.length ? s.cyc : ['—']), t('Paths', s.path.length ? s.path : ['—']), v('l … r', s.lr.join(' … '))],
}
