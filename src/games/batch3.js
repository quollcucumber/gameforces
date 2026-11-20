import { cf, tier3, sortNum, sum } from './util.js'
import { randomTree } from './batch1.js'

const n1 = (s) => s.t

export const playingWithString = {
  id: 'playing-with-string',
  title: 'Playing with String',
  cf: cf(305, 'E', 'Playing with String', 2300),
  roles: ['First', 'Second'],
  kind: 'win',
  rules:
    'There are pieces of paper with strings on them, starting with one. On each turn a player picks a piece t and a position i that is not at either end, where t[i−1] = t[i+1]. They cut t into three pieces: everything left of i, the single letter t[i], and everything right of i. A player who cannot move loses. First moves first.',
  generate: (rng, tier) => ({ p: [rng.str(tier3(tier, 6, 9, 13), tier3(tier, 'ab', 'ab', 'abc'))], t: 0 }),
  turn: n1,
  moves: (s) => {
    const r = []
    s.p.forEach((str, j) => {
      for (let i = 1; i + 1 < str.length; i++) if (str[i - 1] === str[i + 1]) r.push([j, i])
    })
    return r
  },
  apply: (s, [j, i]) => {
    const str = s.p[j]
    const p = s.p.slice()
    p.splice(j, 1, str.slice(0, i), str[i], str.slice(i + 1))
    return { p: p.filter((x) => x.length >= 3), t: 1 - s.t }
  },
  key: (s) => `${s.p.slice().sort()}|${s.t}`,
  label: (s, [j, i]) => `cut "${s.p[j]}" at ${i + 1}`,
  board: 'cutString',
}

const dotRuns = (str) => (str.match(/\.+/g) || []).map((x) => x.length)
export const gameWithString = {
  id: 'game-with-string',
  title: 'Game With String',
  cf: cf(1221, 'E', 'Game With String', 2500),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'There is a string of . and X, and two lengths a > b. On her turn Alice must replace a block of exactly a consecutive dots with X. On his turn Bob must do the same with a block of exactly b dots. A player who cannot move loses. Alice moves first.',
  generate: (rng, tier) => {
    const b = rng.int(1, 3)
    const a = b + rng.int(1, 3)
    const n = tier3(tier, 8, 12, 16)
    const s = [...rng.str(n, '....X')].join('')
    return { s, ab: [a, b], t: 0 }
  },
  turn: n1,
  moves: (s) => {
    const L = s.ab[s.t]
    const r = []
    for (let i = 0; i + L <= s.s.length; i++) if (!s.s.slice(i, i + L).includes('X')) r.push(i)
    return r
  },
  apply: (s, i) => ({ s: s.s.slice(0, i) + 'X'.repeat(s.ab[s.t]) + s.s.slice(i + s.ab[s.t]), ab: s.ab, t: 1 - s.t }),
  key: (s) => `${sortNum(dotRuns(s.s).filter((x) => x >= s.ab[1]))}|${s.ab}|${s.t}`,
  label: (s, i) => `fill ${i + 1}–${i + s.ab[s.t]}`,
  board: 'dots',
}

export const funnyGame = {
  id: 'funny-game',
  title: 'Funny Game',
  cf: cf(731, 'E', 'Funny Game', 2200),
  roles: ['Petya', 'Gena'],
  kind: 'score',
  scoreLabel: "Petya's score − Gena's score",
  rules:
    'Stickers with numbers lie in a row. On each turn, while at least two stickers are left, a player picks k ≥ 2, takes the k leftmost stickers and puts back one new sticker at the left end showing their sum. The player also scores that sum. The game ends with one sticker left. Each player maximises (own score − opponent\'s score). Petya moves first.',
  generate: (rng, tier) => ({ a: rng.array(tier3(tier, 4, 6, 8), -9, 9), d: 0, t: 0 }),
  turn: n1,
  moves: (s) => Array.from({ length: s.a.length - 1 }, (_, i) => i + 2),
  apply: (s, k) => {
    const v = sum(s.a.slice(0, k))
    return { a: [v, ...s.a.slice(k)], d: s.d + (s.t === 0 ? v : -v), t: 1 - s.t }
  },
  outcome: (s) => s.d,
  label: (s, k) => `take ${k} → ${sum(s.a.slice(0, k))}`,
  board: 'stickers',
}

export const arrayGame = {
  id: 'array-game',
  title: 'Array Game',
  cf: cf(1600, 'E', 'Array Game', 1900),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'There is an array, and the players build a sequence together, starting empty. On each turn a player takes a number from the left or right end of the array and appends it to the sequence, which must stay strictly increasing. Whoever makes the last move wins. Alice moves first.',
  generate: (rng, tier) => ({ a: rng.array(tier3(tier, 5, 8, 12), 1, tier3(tier, 9, 15, 25)), l: 0, r: tier3(tier, 5, 8, 12) - 1, last: 0, t: 0 }),
  turn: n1,
  moves: (s) => {
    if (s.l > s.r) return []
    const m = []
    if (s.a[s.l] > s.last) m.push('L')
    if (s.r !== s.l && s.a[s.r] > s.last) m.push('R')
    return m
  },
  apply: (s, m) => ({ ...s, l: m === 'L' ? s.l + 1 : s.l, r: m === 'R' ? s.r - 1 : s.r, last: m === 'L' ? s.a[s.l] : s.a[s.r], t: 1 - s.t }),
  key: (s) => `${s.l}|${s.r}|${s.last}|${s.t}`,
  label: (s, m) => `take ${m === 'L' ? 'left' : 'right'} (${m === 'L' ? s.a[s.l] : s.a[s.r]})`,
  board: 'arrayEnds',
}

export const arenaOfGreed = {
  id: 'arena-of-greed',
  title: 'Arena of Greed',
  cf: cf(1425, 'A', 'Arena of Greed', 1400),
  roles: ['Mr. Chanek', 'Opponent'],
  kind: 'score',
  scoreLabel: "Mr. Chanek's coins",
  rules:
    'A chest holds N gold coins. On each turn a player takes one coin, or takes half of the coins if the count is even. The game ends when the chest is empty, and each player wants as many coins as possible. Mr. Chanek moves first.',
  generate: (rng, tier) => ({ n: rng.int(5, tier3(tier, 20, 60, 200)), got: 0, t: 0 }),
  turn: n1,
  moves: (s) => (s.n === 0 ? [] : s.n % 2 === 0 && s.n > 1 ? [1, s.n / 2] : [1]),
  apply: (s, k) => ({ n: s.n - k, got: s.got + (s.t === 0 ? k : 0), t: 1 - s.t }),
  outcome: (s) => s.got,
  label: (s, k) => (k === 1 ? 'take 1 coin' : `take half (${k})`),
  board: 'chest',
}

export const evenAddicts = {
  id: 'even-number-addicts',
  title: 'Even Number Addicts',
  cf: cf(1738, 'C', 'Even Number Addicts', 1500),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'There is a sequence of integers. On each turn a player removes one of them and keeps it. When none are left, Alice wins if the sum of the numbers she took is even, and Bob wins otherwise. Alice moves first.',
  generate: (rng, tier) => ({ a: sortNum(rng.array(tier3(tier, 4, 7, 11), 1, 20)), mine: 0, t: 0 }),
  turn: n1,
  moves: (s) => [...new Set(s.a)],
  apply: (s, v) => {
    const a = s.a.slice()
    a.splice(a.indexOf(v), 1)
    return { a, mine: s.t === 0 ? (s.mine + v) % 2 : s.mine, t: 1 - s.t }
  },
  outcome: (s) => (s.mine % 2 === 0 ? 1 : -1),
  key: (s) => `${s.a.filter((x) => x % 2).length}|${s.a.filter((x) => x % 2 === 0).length}|${s.mine}|${s.t}`,
  label: (s, v) => `take ${v}`,
  board: 'numbers',
}

export const colouringGame = {
  id: 'colouring-game',
  title: 'Colouring Game',
  cf: cf(1704, 'F', 'Colouring Game', 2600),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'A row of cells is coloured red (R) or blue (B). On her turn Alice paints two neighbouring cells white, and at least one of them must be red. On his turn Bob does the same, but at least one of his two cells must be blue. A chosen cell may already be white. A player who cannot move loses. Alice moves first.',
  generate: (rng, tier) => ({ s: rng.str(tier3(tier, 5, 8, 12), 'RB'), t: 0 }),
  turn: n1,
  moves: (s) => {
    const c = s.t === 0 ? 'R' : 'B'
    const r = []
    for (let i = 0; i + 1 < s.s.length; i++) if (s.s[i] === c || s.s[i + 1] === c) r.push(i)
    return r
  },
  apply: (s, i) => ({ s: s.s.slice(0, i) + 'WW' + s.s.slice(i + 2), t: 1 - s.t }),
  label: (s, i) => `paint ${i + 1}–${i + 2}`,
  board: 'colouring',
}

export const chessPiece = {
  id: 'new-game-chess-piece',
  title: 'New Game with a Chess Piece',
  cf: cf(36, 'D', 'New Game with a Chess Piece', 2300),
  roles: ['Petya', 'Vasya'],
  kind: 'win',
  rules:
    'A piece starts in the top-left corner of an n × m board. On each turn a player moves it one square right, one square down, or exactly k squares diagonally down-right. A player who cannot move loses. Petya moves first.',
  generate: (rng, tier) => ({ n: rng.int(3, tier3(tier, 5, 8, 12)), m: rng.int(3, tier3(tier, 5, 8, 12)), k: rng.int(1, 4), r: 0, c: 0, t: 0 }),
  turn: n1,
  moves: (s) => {
    const m = []
    if (s.c + 1 < s.m) m.push([0, 1])
    if (s.r + 1 < s.n) m.push([1, 0])
    if (s.r + s.k < s.n && s.c + s.k < s.m) m.push([s.k, s.k])
    return m
  },
  apply: (s, [dr, dc]) => ({ ...s, r: s.r + dr, c: s.c + dc, t: 1 - s.t }),
  label: (s, [dr, dc]) => (dr && dc ? `diagonal ${dr}` : dr ? 'down' : 'right'),
  board: 'chip',
}

const treeMoves = (s) => {
  const r = []
  for (const [u, v] of s.edges) {
    if (u === s.p && !((s.vis >> v) & 1)) r.push(v)
    if (v === s.p && !((s.vis >> u) & 1)) r.push(u)
  }
  return r
}
const treeBase = {
  roles: ['Ron', 'Hermione'],
  kind: 'win',
  turn: n1,
  moves: treeMoves,
  apply: (s, v) => ({ ...s, p: v, vis: s.vis | (1 << v), t: 1 - s.t }),
  key: (s) => `${s.p}|${s.vis}|${s.t}`,
  label: (s, v) => `move to ${v + 1}`,
  board: 'stoneTree',
}
const treeRules =
  'A stone sits on one node of a tree, and that node counts as activated. On each turn a player moves the stone to an inactive neighbour, which activates it. A player who cannot move loses. Ron moves first.'
export const treeEasy = {
  ...treeBase,
  id: 'game-on-tree-easy',
  title: 'Game on Tree (Easy)',
  cf: cf(1970, 'C1', 'Game on Tree (Easy)', 1400),
  rules: 'The tree is a path. ' + treeRules,
  generate: (rng, tier) => {
    const n = tier3(tier, 5, 9, 15)
    const p = rng.shuffle(Array.from({ length: n }, (_, i) => i))
    const edges = p.slice(1).map((v, i) => [p[i], v])
    const start = rng.int(0, n - 1)
    return { n, edges, p: start, vis: 1 << start, t: 0 }
  },
}
export const treeMedium = {
  ...treeBase,
  id: 'game-on-tree-medium',
  title: 'Game on Tree (Medium)',
  cf: cf(1970, 'C2', 'Game on Tree (Medium)', 1700),
  rules: treeRules,
  generate: (rng, tier) => {
    const n = tier3(tier, 6, 10, 15)
    const start = rng.int(0, n - 1)
    return { n, edges: randomTree(rng, n), p: start, vis: 1 << start, t: 0 }
  },
}

export const gameOfParity = {
  id: 'game-of-parity',
  title: 'The Game Of Parity',
  cf: cf(549, 'C', 'The Game Of Parity', 2200),
  roles: ['Stannis', 'Daenerys'],
  kind: 'win',
  rules:
    'There are n cities, each with some population. On each turn a player burns one city. The game ends when exactly k cities remain. Daenerys wins if the total surviving population is even, and Stannis wins if it is odd. Stannis moves first.',
  generate: (rng, tier) => {
    const n = tier3(tier, 5, 8, 12)
    return { a: rng.array(n, 1, 30), k: rng.int(1, n - 2), t: 0 }
  },
  turn: n1,
  moves: (s) => (s.a.length <= s.k ? [] : [...new Set(s.a)]),
  apply: (s, v) => {
    const a = s.a.slice()
    a.splice(a.indexOf(v), 1)
    return { a, k: s.k, t: 1 - s.t }
  },
  terminal: (s) => (s.a.length === s.k ? (sum(s.a) % 2 ? 1 : -1) : null),
  key: (s) => `${s.a.filter((x) => x % 2).length}|${s.a.length}|${s.k}|${s.t}`,
  label: (s, v) => `burn city of ${v}`,
  board: 'numbers',
}

export const mathletes = {
  id: 'game-of-mathletes',
  title: 'Game of Mathletes',
  cf: cf(2060, 'C', 'Game of Mathletes', 900),
  roles: ['Alice', 'Bob'],
  kind: 'score',
  scoreLabel: 'score (Alice wants it low)',
  rules:
    'There is an even count of numbers on a board, a target k, and a score that starts at 0. Each round, Alice erases a number a, then Bob erases a number b, and if a + b = k the score goes up by 1. Alice wants the final score low and Bob wants it high.',
  generate: (rng, tier) => {
    const n = tier3(tier, 4, 6, 10)
    const k = rng.int(4, 10)
    return { a: sortNum(rng.array(n, 1, k - 1)), k, sc: 0, last: null, t: 0 }
  },
  turn: n1,
  moves: (s) => [...new Set(s.a)],
  apply: (s, v) => {
    const a = s.a.slice()
    a.splice(a.indexOf(v), 1)
    if (s.t === 0) return { ...s, a, last: v, t: 1 }
    return { ...s, a, sc: s.sc + (s.last + v === s.k ? 1 : 0), last: null, t: 0 }
  },
  outcome: (s) => -s.sc,
  formatValue: (v) => `${-v}`,
  label: (s, v) => `erase ${v}`,
  board: 'numbers',
}
