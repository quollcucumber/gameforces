import { cf, tier3, sortNum, divisors, isPal, mex, winnerSign, sum } from './util.js'

const n1 = (s) => s.t

export const integers = {
  id: 'game-with-integers',
  title: 'Game with Integers',
  cf: cf(1899, 'A', 'Game with Integers', 800),
  roles: ['Vanya', 'Vova'],
  kind: 'win',
  rules:
    'There is an integer n. On each turn a player adds 1 to it or subtracts 1. Vanya moves first. If the number is divisible by 3 right after Vanya moves, Vanya wins. If 10 moves pass without that happening, Vova wins.',
  generate: (rng, tier) => ({ n: rng.int(1, tier3(tier, 20, 200, 1000)), k: 0, t: 0, won: false }),
  turn: n1,
  moves: () => [1, -1],
  apply: (s, m) => ({ n: s.n + m, k: s.k + 1, t: 1 - s.t, won: s.t === 0 && (s.n + m) % 3 === 0 }),
  terminal: (s) => (s.won ? 1 : s.k >= 10 ? -1 : null),
  label: (s, m) => (m > 0 ? '+1' : '−1'),
  board: 'integers',
}

export const zeroOne = {
  id: '01-game',
  title: '01 Game',
  cf: cf(1373, 'B', '01 Game', 900),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'There is a binary string. On each turn a player picks two adjacent characters that differ and deletes them. A player who cannot move loses. Alice moves first.',
  generate: (rng, tier) => ({ s: rng.str(tier3(tier, 6, 10, 16), '01'), t: 0 }),
  turn: n1,
  moves: (s) => {
    const r = []
    for (let i = 0; i + 1 < s.s.length; i++) if (s.s[i] !== s.s[i + 1]) r.push(i)
    return r
  },
  apply: (s, i) => ({ s: s.s.slice(0, i) + s.s.slice(i + 2), t: 1 - s.t }),
  label: (s, i) => `delete ${s.s.slice(i, i + 2)} at ${i + 1}`,
  board: 'pairDelete',
}

export const evenOdd959 = {
  id: 'even-odd-game',
  title: 'The Even-Odd Game',
  cf: cf(959, 'A', 'Mahmoud and Ehab and the even-odd game', 800),
  roles: ['Mahmoud', 'Ehab'],
  kind: 'win',
  rules:
    'There is an integer n. On each turn a player subtracts some a with 1 ≤ a ≤ n. Mahmoud must subtract an even a and Ehab must subtract an odd a. A player who cannot move loses. Mahmoud moves first.',
  generate: (rng, tier) => ({ n: rng.int(1, tier3(tier, 10, 30, 60)), t: 0 }),
  turn: n1,
  moves: (s) => {
    const r = []
    for (let a = s.t === 0 ? 2 : 1; a <= s.n; a += 2) r.push(a)
    return r
  },
  apply: (s, a) => ({ n: s.n - a, t: 1 - s.t }),
  label: (s, a) => `−${a}`,
  board: 'subtract',
}

function palMoves(s, allowRev) {
  const r = []
  for (let i = 0; i < s.s.length; i++) if (s.s[i] === '0') r.push(i)
  if (allowRev && !s.rev && !isPal(s.s)) r.push('R')
  return r
}
const palApply = (s, m) => {
  if (m === 'R') return { ...s, s: [...s.s].reverse().join(''), rev: true, t: 1 - s.t }
  const cost = s.cost.slice()
  cost[s.t]++
  return { s: s.s.slice(0, m) + '1' + s.s.slice(m + 1), rev: false, cost, t: 1 - s.t }
}
const palBase = {
  roles: ['Alice', 'Bob'],
  kind: 'win',
  turn: n1,
  moves: (s) => palMoves(s, true),
  apply: palApply,
  terminal: (s) => (s.s.includes('0') ? null : Math.sign(s.cost[1] - s.cost[0])),
  key: (s) => `${s.s}|${s.rev ? 1 : 0}|${s.cost[0] - s.cost[1]}|${s.t}`,
  label: (s, m) => (m === 'R' ? 'reverse' : `flip ${m + 1} ($1)`),
  board: 'palindrome',
}
const palRules =
  'On each turn a player either changes a 0 to a 1 and pays $1, or reverses the whole string for free. Reversing is only allowed when the string is not a palindrome and the previous move was not a reverse. The game ends when every character is 1, and whoever has spent less wins (equal is a draw). Alice moves first.'
export const palindromeEasy = {
  ...palBase,
  id: 'palindrome-game-easy',
  title: 'Palindrome Game (easy)',
  cf: cf(1527, 'B1', 'Palindrome Game (easy version)', 1200),
  rules: 'The binary string starts as a palindrome. ' + palRules,
  generate: (rng, tier) => {
    const n = tier3(tier, 5, 7, 9)
    const half = rng.str(Math.ceil(n / 2), '0001')
    const s = half + Array.from(half.slice(0, Math.floor(n / 2))).reverse().join('')
    return { s: s.includes('0') ? s : '0' + s.slice(1, -1) + '0', rev: false, cost: [0, 0], t: 0 }
  },
}
export const palindromeHard = {
  ...palBase,
  id: 'palindrome-game-hard',
  title: 'Palindrome Game (hard)',
  cf: cf(1527, 'B2', 'Palindrome Game (hard version)', 1900),
  rules: 'The binary string can be anything. ' + palRules,
  generate: (rng, tier) => {
    let s = rng.str(tier3(tier, 5, 7, 9), '0001')
    if (!s.includes('0')) s = '0' + s.slice(1)
    return { s, rev: false, cost: [0, 0], t: 0 }
  },
}

export const wallets = {
  id: 'wallet-exchange',
  title: 'Wallet Exchange',
  cf: cf(1919, 'A', 'Wallet Exchange', 800),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'Alice and Bob each hold a wallet of coins. On each turn a player may first swap wallets with the opponent, then must remove 1 coin from the wallet they now hold (it cannot be empty). A player who cannot move loses. Alice moves first.',
  generate: (rng, tier) => {
    const hi = tier3(tier, 5, 9, 14)
    return { w: [rng.int(1, hi), rng.int(1, hi)], t: 0 }
  },
  turn: n1,
  moves: (s) => {
    const r = []
    if (s.w[s.t] > 0) r.push('keep')
    if (s.w[1 - s.t] > 0) r.push('swap')
    return r
  },
  apply: (s, m) => {
    const w = m === 'swap' ? [s.w[1], s.w[0]] : s.w.slice()
    w[s.t]--
    return { w, t: 1 - s.t }
  },
  label: (s, m) => (m === 'swap' ? 'swap, then pay 1' : 'keep, then pay 1'),
  board: 'wallets',
}

export const frogs = {
  id: 'two-frogs',
  title: 'Two Frogs',
  cf: cf(2055, 'A', 'Two Frogs', 800),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  cyclic: true,
  rules:
    'Two frogs sit on different lilypads in a row of n. On its turn a frog must jump one pad left or right. It must stay on the row and cannot land on the other frog. A frog that cannot jump loses. Alice moves first.',
  generate: (rng, tier) => {
    const n = rng.int(...tier3(tier, [3, 6], [6, 10], [10, 16]))
    const [a, b] = rng.shuffle(Array.from({ length: n }, (_, i) => i + 1)).slice(0, 2)
    return { n, p: [a, b], t: 0 }
  },
  turn: n1,
  moves: (s) => {
    const me = s.p[s.t]
    const o = s.p[1 - s.t]
    return [-1, 1].filter((d) => me + d >= 1 && me + d <= s.n && me + d !== o)
  },
  apply: (s, d) => {
    const p = s.p.slice()
    p[s.t] += d
    return { n: s.n, p, t: 1 - s.t }
  },
  label: (s, d) => (d < 0 ? 'jump left' : 'jump right'),
  board: 'frogs',
}

function counts(str) {
  const c = {}
  for (const ch of str) c[ch] = (c[ch] || 0) + 1
  return c
}
export const littleGirl = {
  id: 'little-girl-and-game',
  title: 'Little Girl and Game',
  cf: cf(276, 'B', 'Little Girl and Game', 1300),
  roles: ['First', 'Second'],
  kind: 'win',
  rules:
    'There is a string of letters. On each turn a player removes any one letter. If, at the start of a player\'s turn, the letters can be rearranged into a palindrome, that player wins. First moves first.',
  generate: (rng, tier) => ({ s: rng.str(tier3(tier, 6, 9, 13), tier3(tier, 'abc', 'abcd', 'abcde')), t: 0 }),
  turn: n1,
  terminal: (s) => {
    const odd = Object.values(counts(s.s)).filter((c) => c % 2).length
    return odd <= 1 ? winnerSign(s.t) : null
  },
  moves: (s) => [...new Set(s.s)].sort(),
  apply: (s, ch) => {
    const i = s.s.indexOf(ch)
    return { s: s.s.slice(0, i) + s.s.slice(i + 1), t: 1 - s.t }
  },
  key: (s) => `${Object.values(counts(s.s)).sort().join(',')}|${s.t}`,
  label: (s, ch) => `remove ${ch}`,
  board: 'letters',
}

export const evenOddArray = {
  id: 'even-odd-array',
  title: 'Even-Odd Game',
  cf: cf(1472, 'D', 'Even-Odd Game', 1200),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'There is an array of numbers. On each turn a player removes one number. Alice scores it if it is even, and Bob scores it if it is odd. When the array is empty, the higher score wins (equal is a draw). Alice moves first.',
  generate: (rng, tier) => ({ a: sortNum(rng.array(tier3(tier, 5, 7, 9), 1, 12)), sc: [0, 0], t: 0 }),
  turn: n1,
  moves: (s) => [...new Set(s.a)],
  apply: (s, v) => {
    const a = s.a.slice()
    a.splice(a.indexOf(v), 1)
    const sc = s.sc.slice()
    if ((v % 2 === 0) === (s.t === 0)) sc[s.t] += v
    return { a, sc, t: 1 - s.t }
  },
  outcome: (s) => Math.sign(s.sc[0] - s.sc[1]),
  key: (s) => `${s.a}|${s.sc[0] - s.sc[1]}|${s.t}`,
  label: (s, v) => `take ${v}`,
  board: 'numbers',
}

export const numberGame = {
  id: 'number-game',
  title: 'Number Game',
  cf: cf(1370, 'C', 'Number Game', 1400),
  roles: ['Ashishgup', 'FastestFinger'],
  kind: 'win',
  rules:
    'There is an integer n. On each turn a player either divides n by one of its odd divisors greater than 1 (n itself counts), or subtracts 1 if n > 1. A player who cannot move loses. Ashishgup moves first.',
  generate: (rng, tier) => ({ n: rng.int(2, tier3(tier, 30, 200, 2000)), t: 0 }),
  turn: n1,
  moves: (s) => {
    const r = divisors(s.n).filter((d) => d > 1 && d % 2 === 1).map((d) => `/${d}`)
    if (s.n > 1) r.push('-1')
    return r
  },
  apply: (s, m) => ({ n: m === '-1' ? s.n - 1 : s.n / Number(m.slice(1)), t: 1 - s.t }),
  label: (s, m) => (m === '-1' ? '−1' : `÷${m.slice(1)}`),
  board: 'numberOps',
}

export const sequentialNim = {
  id: 'sequential-nim',
  title: 'Sequential Nim',
  cf: cf(1382, 'B', 'Sequential Nim', 1100),
  roles: ['First', 'Second'],
  kind: 'win',
  rules:
    'There are piles of stones in a row. On each turn a player removes any positive number of stones from the first non-empty pile. A player who cannot move loses. First moves first.',
  generate: (rng, tier) => ({ a: rng.array(tier3(tier, 4, 6, 9), 1, tier3(tier, 3, 4, 5)), t: 0 }),
  turn: n1,
  moves: (s) => {
    const i = s.a.findIndex((x) => x > 0)
    if (i < 0) return []
    return Array.from({ length: s.a[i] }, (_, k) => [i, k + 1])
  },
  apply: (s, [i, k]) => {
    const a = s.a.slice()
    a[i] -= k
    return { a, t: 1 - s.t }
  },
  label: (s, [i, k]) => `take ${k} from pile ${i + 1}`,
  board: 'piles',
}

function runs(str) {
  const r = []
  for (let i = 0; i < str.length; ) {
    let j = i
    while (j < str.length && str[j] === str[i]) j++
    r.push([i, j - i])
    i = j
  }
  return r
}
export const substringRemoval = {
  id: 'substring-removal',
  title: 'Substring Removal Game',
  cf: cf(1398, 'B', 'Substring Removal Game', 800),
  roles: ['Alice', 'Bob'],
  kind: 'score',
  scoreLabel: "Alice's score",
  rules:
    'There is a binary string. On each turn a player deletes any block of one or more consecutive equal characters, and the parts on either side join up. Each player scores the number of 1s they delete. Both try to maximise their own score. Alice moves first.',
  generate: (rng, tier) => ({ s: rng.str(tier3(tier, 7, 10, 13), '01'), sc: [0, 0], t: 0 }),
  turn: n1,
  moves: (s) => {
    const r = []
    for (const [i, len] of runs(s.s)) for (let k = 1; k <= len; k++) r.push([i, k])
    return r
  },
  apply: (s, [i, k]) => {
    const sc = s.sc.slice()
    if (s.s[i] === '1') sc[s.t] += k
    return { s: s.s.slice(0, i) + s.s.slice(i + k), sc, t: 1 - s.t }
  },
  outcome: (s) => s.sc[0],
  key: (s) => `${s.s}|${s.sc[0]}|${s.t}`,
  label: (s, [i, k]) => `delete ${s.s[i].repeat(k)} at ${i + 1}`,
  board: 'blockDelete',
}

export const gameWithBoard = {
  id: 'game-with-board',
  title: 'Game with Board',
  cf: cf(1841, 'A', 'Game with Board', 800),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'The board holds n ones. On each turn a player wipes at least two equal numbers and writes their sum. A player who cannot move (all numbers are different) WINS. Alice moves first.',
  generate: (rng, tier) => ({ a: Array(rng.int(...tier3(tier, [3, 6], [6, 10], [10, 16]))).fill(1), t: 0 }),
  turn: n1,
  moves: (s) => {
    const c = {}
    for (const v of s.a) c[v] = (c[v] || 0) + 1
    const r = []
    for (const v of Object.keys(c).map(Number).sort((x, y) => x - y)) for (let k = 2; k <= c[v]; k++) r.push([v, k])
    return r
  },
  apply: (s, [v, k]) => {
    const a = s.a.slice()
    for (let i = 0; i < k; i++) a.splice(a.indexOf(v), 1)
    a.push(v * k)
    return { a: sortNum(a), t: 1 - s.t }
  },
  outcome: (s) => winnerSign(s.t),
  label: (s, [v, k]) => `${k}×${v} → ${v * k}`,
  board: 'board',
}

export const subtraction = {
  id: 'subtraction-game',
  title: 'Subtraction Game',
  cf: cf(1844, 'A', 'Subtraction Game', 800),
  roles: ['First', 'Second'],
  kind: 'win',
  rules:
    'There is a pile of n stones and two numbers a < b. On each turn a player removes exactly a or exactly b stones. A player who cannot move loses. First moves first.',
  generate: (rng, tier) => {
    const a = rng.int(1, tier3(tier, 2, 4, 6))
    const b = a + rng.int(1, tier3(tier, 2, 4, 6))
    return { n: rng.int(b, tier3(tier, 15, 40, 90)), ab: [a, b], t: 0 }
  },
  turn: n1,
  moves: (s) => s.ab.filter((x) => x <= s.n),
  apply: (s, x) => ({ n: s.n - x, ab: s.ab, t: 1 - s.t }),
  label: (s, x) => `take ${x}`,
  board: 'subtract',
}

export const coinGames = {
  id: 'coin-games',
  title: 'Coin Games',
  cf: cf(1972, 'B', 'Coin Games', 900),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'Coins lie in a circle, each facing up (U) or down (D). On each turn a player removes a face-up coin and flips its two neighbours. With only two coins left, the other coin is not flipped, and with one coin left nothing is flipped. A player with no face-up coin to pick loses. Alice moves first.',
  generate: (rng, tier) => ({ s: rng.str(tier3(tier, 5, 8, 12), 'UD'), t: 0 }),
  turn: n1,
  moves: (s) => [...s.s].map((c, i) => (c === 'U' ? i : -1)).filter((i) => i >= 0),
  apply: (s, i) => {
    const flip = (c) => (c === 'U' ? 'D' : 'U')
    const a = [...s.s]
    const n = a.length
    if (n > 2) {
      a[(i + 1) % n] = flip(a[(i + 1) % n])
      a[(i + n - 1) % n] = flip(a[(i + n - 1) % n])
    }
    a.splice(i, 1)
    return { s: a.join(''), t: 1 - s.t }
  },
  label: (s, i) => `remove coin ${i + 1}`,
  board: 'coins',
}

export const matrixGame = {
  id: 'matrix-game',
  title: 'Matrix Game',
  cf: cf(1365, 'A', 'Matrix Game', 1100),
  roles: ['Ashish', 'Vivek'],
  kind: 'win',
  rules:
    'On each turn a player claims an empty cell of the grid. The cell must not share a row or column with any already-claimed cell (some cells start claimed). A player who cannot move loses. Ashish moves first.',
  generate: (rng, tier) => {
    const n = tier3(tier, 3, 4, 6)
    const m = tier3(tier, 4, 5, 6)
    const g = Array.from({ length: n }, () => Array(m).fill(0))
    for (let k = rng.int(0, 2); k > 0; k--) g[rng.int(0, n - 1)][rng.int(0, m - 1)] = 2
    return { g, t: 0 }
  },
  turn: n1,
  moves: (s) => {
    const r = []
    const rows = s.g.map((row) => row.some((x) => x))
    const cols = s.g[0].map((_, j) => s.g.some((row) => row[j]))
    s.g.forEach((row, i) => row.forEach((_, j) => !rows[i] && !cols[j] && r.push([i, j])))
    return r
  },
  apply: (s, [i, j]) => {
    const g = s.g.map((row) => row.slice())
    g[i][j] = s.t === 0 ? 1 : 3
    return { g, t: 1 - s.t }
  },
  key: (s) => {
    const rows = s.g.filter((row) => !row.some((x) => x)).length
    const cols = s.g[0].filter((_, j) => !s.g.some((row) => row[j])).length
    return `${Math.min(rows, cols)}|${s.t}`
  },
  label: (s, [i, j]) => `claim (${i + 1}, ${j + 1})`,
  board: 'matrix',
}

export const gameOfDivision = {
  id: 'game-of-division',
  title: 'Game of Division',
  cf: cf(2040, 'A', 'Game of Division', 800),
  roles: ['First', 'Second'],
  kind: 'win',
  rules:
    'There is an array and a number k. First picks an index i, then Second picks a different index j. First wins if |a_i − a_j| is NOT divisible by k, and otherwise Second wins.',
  generate: (rng, tier) => ({ a: rng.array(tier3(tier, 4, 6, 9), 1, tier3(tier, 12, 30, 60)), k: rng.int(2, tier3(tier, 3, 5, 7)), pick: [], t: 0 }),
  turn: n1,
  moves: (s) => (s.pick.length >= 2 ? [] : s.a.map((_, i) => i).filter((i) => !s.pick.includes(i))),
  apply: (s, i) => ({ ...s, pick: [...s.pick, i], t: 1 - s.t }),
  terminal: (s) => (s.pick.length === 2 ? (Math.abs(s.a[s.pick[0]] - s.a[s.pick[1]]) % s.k !== 0 ? 1 : -1) : null),
  label: (s, i) => `pick a[${i + 1}] = ${s.a[i]}`,
  board: 'division',
}

export const swapGame = {
  id: 'swap-game',
  title: 'Swap Game',
  cf: cf(1747, 'C', 'Swap Game', 1200),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'There is an array of positive numbers. On your turn, if a₁ = 0 you lose. Otherwise you pick some i ≥ 2, decrease a₁ by 1 and swap a₁ with aᵢ. Alice moves first.',
  generate: (rng, tier) => ({ a: rng.array(tier3(tier, 3, 3, 4), 1, tier3(tier, 3, 5, 4)), t: 0 }),
  turn: n1,
  terminal: (s) => (s.a[0] === 0 ? -winnerSign(s.t) : null),
  moves: (s) => s.a.map((_, i) => i).slice(1),
  apply: (s, i) => {
    const a = s.a.slice()
    a[0]--
    ;[a[0], a[i]] = [a[i], a[0]]
    return { a, t: 1 - s.t }
  },
  key: (s) => `${s.a[0]}|${sortNum(s.a.slice(1))}|${s.t}`,
  label: (s, i) => `swap with a[${i + 1}]`,
  board: 'swap',
}

function randomTree(rng, n) {
  const edges = []
  for (let v = 1; v < n; v++) edges.push([rng.int(0, v - 1), v])
  const perm = rng.shuffle(Array.from({ length: n }, (_, i) => i))
  return edges.map(([u, v]) => [perm[u], perm[v]])
}
export { randomTree }

export const gameOnLeaves = {
  id: 'game-on-leaves',
  title: 'Game On Leaves',
  cf: cf(1363, 'C', 'Game On Leaves', 1600),
  roles: ['Ayush', 'Ashish'],
  kind: 'win',
  rules:
    'There is a tree with one special node x. On each turn a player removes a leaf, meaning a node with at most one edge. Whoever removes x wins. Ayush moves first.',
  generate: (rng, tier) => {
    const n = tier3(tier, 6, 9, 13)
    return { n, edges: randomTree(rng, n), x: rng.int(0, n - 1), gone: 0, t: 0, win: null }
  },
  turn: n1,
  terminal: (s) => s.win,
  moves: (s) => {
    const deg = Array(s.n).fill(0)
    for (const [u, v] of s.edges) if (!((s.gone >> u) & 1) && !((s.gone >> v) & 1)) {
        deg[u]++
        deg[v]++
      }
    const r = []
    for (let v = 0; v < s.n; v++) if (!((s.gone >> v) & 1) && deg[v] <= 1) r.push(v)
    return r
  },
  apply: (s, v) => ({ ...s, gone: s.gone | (1 << v), t: 1 - s.t, win: v === s.x ? winnerSign(s.t) : null }),
  key: (s) => `${s.gone}|${s.t}|${s.win}`,
  label: (s, v) => `remove node ${v + 1}`,
  board: 'leaves',
}

export const digitGame = {
  id: 'digit-game',
  title: 'Digit Game',
  cf: cf(1419, 'A', 'Digit Game', 900),
  roles: ['Raze', 'Breach'],
  kind: 'win',
  rules:
    'There is a number with n digits. On each turn a player marks an unmarked digit. Raze may only mark digits in odd positions (1st, 3rd, …) and Breach only digits in even positions. When one digit is left, Raze wins if it is odd and Breach wins if it is even. Raze moves first.',
  generate: (rng, tier) => ({ d: rng.str(rng.int(...tier3(tier, [4, 5], [6, 8], [9, 11])), '0123456789').replace(/^0/, '7'), m: '', t: 0 }),
  turn: n1,
  terminal: (s) => {
    const left = [...s.d].filter((_, i) => !s.m.includes(`,${i},`))
    return left.length === 1 ? (Number(left[0]) % 2 ? 1 : -1) : null
  },
  moves: (s) => [...s.d].map((_, i) => i).filter((i) => i % 2 === s.t && !s.m.includes(`,${i},`)),
  apply: (s, i) => ({ d: s.d, m: `${s.m},${i},`, t: 1 - s.t }),
  key: (s) => {
    const odd = [0, 0, 0, 0]
    ;[...s.d].forEach((c, i) => !s.m.includes(`,${i},`) && odd[(i % 2) * 2 + (Number(c) % 2)]++)
    return `${odd}|${s.t}`
  },
  label: (s, i) => `mark digit ${i + 1} (${s.d[i]})`,
  board: 'digits',
}

export const circleGame = {
  id: 'circle-game',
  title: 'Circle Game',
  cf: cf(1695, 'B', 'Circle Game', 1000),
  roles: ['Mike', 'Joe'],
  kind: 'win',
  rules:
    'Piles of stones stand in a circle. The players take turns going clockwise from pile 1: on each turn the player must remove a positive number of stones from the next pile. A player who faces an empty pile loses. Mike moves first.',
  generate: (rng, tier) => ({ a: rng.array(tier3(tier, 2, 3, 3), 1, tier3(tier, 4, 4, 6)), i: 0, t: 0 }),
  turn: n1,
  moves: (s) => Array.from({ length: s.a[s.i] }, (_, k) => k + 1),
  apply: (s, k) => {
    const a = s.a.slice()
    a[s.i] -= k
    return { a, i: (s.i + 1) % a.length, t: 1 - s.t }
  },
  label: (s, k) => `take ${k} from pile ${s.i + 1}`,
  board: 'circle',
}

export const chipGame = {
  id: 'chip-game',
  title: 'Chip Game',
  cf: cf(1719, 'A', 'Chip Game', 800),
  roles: ['Burenka', 'Tonya'],
  kind: 'win',
  rules:
    'A chip starts in the bottom-left corner of an n × m board. On each turn a player moves it right or up by any odd number of cells (not both directions at once). A player who cannot move loses. Burenka moves first.',
  generate: (rng, tier) => ({ n: rng.int(2, tier3(tier, 4, 7, 10)), m: rng.int(2, tier3(tier, 4, 7, 10)), r: 0, c: 0, t: 0 }),
  turn: n1,
  moves: (s) => {
    const r = []
    for (let d = 1; s.c + d < s.m; d += 2) r.push([0, d])
    for (let d = 1; s.r + d < s.n; d += 2) r.push([d, 0])
    return r
  },
  apply: (s, [dr, dc]) => ({ ...s, r: s.r + dr, c: s.c + dc, t: 1 - s.t }),
  label: (s, [dr, dc]) => (dr ? `up ${dr}` : `right ${dc}`),
  board: 'chip',
}

export const mexGame = {
  id: 'mex-game-1',
  title: 'MEX Game 1',
  cf: cf(1943, 'A', 'MEX Game 1', 1300),
  roles: ['Alice', 'Bob'],
  kind: 'score',
  scoreLabel: 'MEX of c',
  rules:
    'There is an array a, and Alice also has an array c that starts empty. On her turn Alice moves one element of a into c. On his turn Bob deletes one element of a. When a is empty, the score is MEX(c), the smallest non-negative integer not in c. Alice wants it high and Bob wants it low. Alice moves first.',
  generate: (rng, tier) => {
    const n = tier3(tier, 6, 8, 11)
    return { a: sortNum(rng.array(n, 0, Math.ceil(n / 2))), c: [], t: 0 }
  },
  turn: n1,
  moves: (s) => [...new Set(s.a)],
  apply: (s, v) => {
    const a = s.a.slice()
    a.splice(a.indexOf(v), 1)
    return { a, c: s.t === 0 ? sortNum([...new Set([...s.c, v])]) : s.c, t: 1 - s.t }
  },
  outcome: (s) => mex(s.c),
  label: (s, v) => (s.t === 0 ? `keep ${v}` : `delete ${v}`),
  board: 'numbers',
}

export const removalsGame = {
  id: 'removals-game',
  title: 'Removals Game',
  cf: cf(2002, 'B', 'Removals Game', 1000),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'Alice and Bob each hold a permutation of 1..n. They take turns, Alice first, and each turn removes the first or last element of their own array. When each array has one element left, Bob wins if the two are equal and Alice wins otherwise.',
  generate: (rng, tier) => {
    const n = tier3(tier, 4, 6, 8)
    const p = Array.from({ length: n }, (_, i) => i + 1)
    let b = rng.shuffle(p)
    if (rng.next() < 0.35) b = rng.next() < 0.5 ? p.slice() : p.slice().reverse()
    const a = rng.shuffle(p)
    return { arr: [a, rng.next() < 0.5 ? b : a.slice().reverse()], t: 0 }
  },
  turn: n1,
  terminal: (s) => (s.arr[0].length === 1 && s.arr[1].length === 1 ? (s.arr[0][0] === s.arr[1][0] ? -1 : 1) : null),
  moves: () => ['L', 'R'],
  apply: (s, m) => {
    const arr = s.arr.map((x) => x.slice())
    if (m === 'L') arr[s.t].shift()
    else arr[s.t].pop()
    return { arr, t: 1 - s.t }
  },
  label: (s, m) => `remove ${m === 'L' ? 'first' : 'last'} (${m === 'L' ? s.arr[s.t][0] : s.arr[s.t].at(-1)})`,
  board: 'removals',
}

export const everythingNim = {
  id: 'everything-nim',
  title: 'Everything Nim',
  cf: cf(1965, 'A', 'Everything Nim', 1400),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'There are piles of stones. On each turn a player picks a k that is at most the size of the smallest non-empty pile, and removes k stones from EVERY non-empty pile. A player who cannot move loses. Alice moves first.',
  generate: (rng, tier) => ({ a: rng.array(tier3(tier, 3, 5, 7), 1, tier3(tier, 6, 10, 16)), t: 0 }),
  turn: n1,
  moves: (s) => {
    const nz = s.a.filter((x) => x > 0)
    return nz.length ? Array.from({ length: Math.min(...nz) }, (_, k) => k + 1) : []
  },
  apply: (s, k) => ({ a: s.a.map((x) => (x > 0 ? x - k : 0)), t: 1 - s.t }),
  key: (s) => `${sortNum(s.a)}|${s.t}`,
  label: (s, k) => `remove ${k} from every pile`,
  board: 'allPiles',
}

export const deletingDivisors = {
  id: 'deleting-divisors',
  title: 'Deleting Divisors',
  cf: cf(1537, 'D', 'Deleting Divisors', 1700),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'There is an integer n. On each turn a player subtracts from n one of its divisors other than 1 and n. A player who cannot move loses. Alice moves first.',
  generate: (rng, tier) => ({ n: rng.int(4, tier3(tier, 40, 300, 3000)), t: 0 }),
  turn: n1,
  moves: (s) => divisors(s.n).filter((d) => d !== 1 && d !== s.n),
  apply: (s, d) => ({ n: s.n - d, t: 1 - s.t }),
  label: (s, d) => `−${d}`,
  board: 'subtract',
}

export const stonedGame = {
  id: 'stoned-game',
  title: 'Stoned Game',
  cf: cf(1396, 'B', 'Stoned Game', 1800),
  roles: ['T', 'HL'],
  kind: 'win',
  rules:
    'There are piles of stones. On each turn a player removes one stone from a non-empty pile, but cannot use the pile chosen on the previous turn. A player who cannot move loses. T moves first.',
  generate: (rng, tier) => ({ a: rng.array(tier3(tier, 3, 4, 5), 1, tier3(tier, 3, 4, 5)), last: -1, t: 0 }),
  turn: n1,
  moves: (s) => s.a.map((x, i) => (x > 0 && i !== s.last ? i : -1)).filter((i) => i >= 0),
  apply: (s, i) => {
    const a = s.a.slice()
    a[i]--
    return { a, last: i, t: 1 - s.t }
  },
  key: (s) => `${sortNum(s.a.filter((_, i) => i !== s.last))}|${s.last < 0 ? -1 : s.a[s.last]}|${s.t}`,
  label: (s, i) => `take from pile ${i + 1}`,
  board: 'stoned',
}

export const letterPicking = {
  id: 'letter-picking',
  title: 'Letter Picking',
  cf: cf(1728, 'D', 'Letter Picking', 1800),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'There is a string of even length, and each player builds their own string, starting empty. On each turn a player takes the first or last letter of the string and puts it at the FRONT of their own string. At the end, the lexicographically smaller string wins (equal is a draw). Alice moves first.',
  generate: (rng, tier) => ({ s: rng.str(tier3(tier, 4, 6, 10), tier3(tier, 'ab', 'abc', 'abc')), own: ['', ''], t: 0 }),
  turn: n1,
  moves: (s) => (s.s.length ? (s.s.length === 1 ? ['L'] : ['L', 'R']) : []),
  apply: (s, m) => {
    const ch = m === 'L' ? s.s[0] : s.s.at(-1)
    const own = s.own.slice()
    own[s.t] = ch + own[s.t]
    return { s: m === 'L' ? s.s.slice(1) : s.s.slice(0, -1), own, t: 1 - s.t }
  },
  outcome: (s) => (s.own[0] < s.own[1] ? 1 : s.own[0] > s.own[1] ? -1 : 0),
  label: (s, m) => `take ${m === 'L' ? 'first' : 'last'} (${m === 'L' ? s.s[0] : s.s.at(-1)})`,
  board: 'letterPicking',
}

export const oneTwoK = {
  id: '1-2-k-game',
  title: '1-2-K Game',
  cf: cf(1194, 'D', '1-2-K Game', 1700),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'A chip sits in cell n of a strip with cells 0..n. On each turn a player moves it 1, 2 or k cells to the left, without going past cell 0. A player who cannot move loses. Alice moves first.',
  generate: (rng, tier) => ({ n: rng.int(3, tier3(tier, 15, 40, 100)), k: rng.int(3, tier3(tier, 5, 9, 14)), t: 0 }),
  turn: n1,
  moves: (s) => [...new Set([1, 2, s.k])].filter((d) => d <= s.n),
  apply: (s, d) => ({ n: s.n - d, k: s.k, t: 1 - s.t }),
  label: (s, d) => `move ${d} left`,
  board: 'strip',
}

const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
const tttWinner = (b) => {
  for (const [x, y, z] of LINES) if (b[x] !== '.' && b[x] === b[y] && b[y] === b[z]) return b[x]
  return null
}
export const ticTacToe = {
  id: 'tic-tac-toe',
  title: 'Tic-tac-toe',
  cf: cf(3, 'C', 'Tic-tac-toe', 1800),
  roles: ['Crosses (X)', 'Noughts (0)'],
  kind: 'win',
  rules:
    'Classic 3 × 3 tic-tac-toe: three in a row, column or diagonal wins, and a full board with no line is a draw. Crosses move first. You start from a mid-game position in which the side to move can force a win.',
  generate: (rng, tier) => {
    for (;;) {
      const b = Array(9).fill('.')
      const k = tier3(tier, 4, 3, 2) + rng.int(0, 1)
      let ok = true
      for (let i = 0; i < k; i++) {
        const free = b.map((c, j) => (c === '.' ? j : -1)).filter((j) => j >= 0)
        b[rng.pick(free)] = i % 2 ? '0' : 'X'
        if (tttWinner(b)) ok = false
      }
      if (ok) return { b: b.join(''), t: k % 2 }
    }
  },
  turn: n1,
  terminal: (s) => {
    const w = tttWinner(s.b)
    if (w) return w === 'X' ? 1 : -1
    return s.b.includes('.') ? null : 0
  },
  moves: (s) => [...s.b].map((c, i) => (c === '.' ? i : -1)).filter((i) => i >= 0),
  apply: (s, i) => ({ b: s.b.slice(0, i) + (s.t === 0 ? 'X' : '0') + s.b.slice(i + 1), t: 1 - s.t }),
  label: (s, i) => `${s.t === 0 ? 'X' : '0'} at (${Math.floor(i / 3) + 1}, ${(i % 3) + 1})`,
  board: 'ttt',
}

export const permutationGame = {
  id: 'permutation-game',
  title: 'Permutation Game',
  cf: cf(1033, 'C', 'Permutation Game', 1600),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'n cells hold distinct numbers from 1 to n, and a token starts on one cell. On each turn a player moves the token from cell i to a cell j where a_j > a_i and |i − j| is a multiple of a_i. A player who cannot move loses. Alice moves first.',
  generate: (rng, tier) => {
    const n = tier3(tier, 7, 12, 18)
    const a = rng.shuffle(Array.from({ length: n }, (_, i) => i + 1))
    return { a, p: rng.int(0, n - 1), t: 0 }
  },
  validate: (s) => permutationGame.moves(s).length > 0,
  turn: n1,
  moves: (s) => s.a.map((v, j) => (v > s.a[s.p] && Math.abs(j - s.p) % s.a[s.p] === 0 ? j : -1)).filter((j) => j >= 0),
  apply: (s, j) => ({ a: s.a, p: j, t: 1 - s.t }),
  key: (s) => `${s.p}|${s.t}`,
  label: (s, j) => `move to cell ${j + 1} (${s.a[j]})`,
  board: 'permutation',
}

export const putKnight = {
  id: 'put-a-knight',
  title: 'Put a Knight!',
  cf: cf(120, 'E', 'Put Knight!', 1400),
  roles: ['Petya', 'Gena'],
  kind: 'win',
  rules:
    'On each turn a player puts a knight on an n × n chessboard where no other knight attacks it. A player who cannot place a knight loses. Petya moves first.',
  generate: (rng, tier) => ({ n: tier3(tier, 3, 4, 4) + (tier === 2 ? rng.int(0, 1) : 0), k: 0, t: 0 }),
  turn: n1,
  moves: (s) => {
    const r = []
    const n = s.n
    const has = (x, y) => x >= 0 && y >= 0 && x < n && y < n && (s.k >> (x * n + y)) & 1
    for (let x = 0; x < n; x++)
      for (let y = 0; y < n; y++) {
        if (has(x, y)) continue
        let ok = true
        for (const [dx, dy] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) if (has(x + dx, y + dy)) ok = false
        if (ok) r.push(x * n + y)
      }
    return r
  },
  apply: (s, c) => ({ n: s.n, k: s.k + 2 ** c, t: 1 - s.t }),
  label: (s, c) => `knight at (${Math.floor(c / s.n) + 1}, ${(c % s.n) + 1})`,
  board: 'knights',
}

export const thanosNim = {
  id: 'thanos-nim',
  title: 'Thanos Nim',
  cf: cf(1147, 'C', 'Thanos Nim', 2000),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'There is an even number n of piles. On each turn a player picks exactly n/2 non-empty piles and removes a positive number of stones from each of them (the amounts can differ). A player who cannot move (fewer than n/2 non-empty piles) loses. Alice moves first.',
  generate: (rng, tier) => ({ a: rng.array(tier3(tier, 2, 4, 4), 1, tier3(tier, 6, 3, 4)), t: 0 }),
  turn: n1,
  moves: (s) => {
    const n = s.a.length
    const res = []
    const rec = (i, chosen, amts) => {
      if (chosen === n / 2) {
        res.push(amts.slice())
        return
      }
      if (i >= n || n - i < n / 2 - chosen) return
      rec(i + 1, chosen, [...amts, 0])
      for (let k = 1; k <= s.a[i]; k++) rec(i + 1, chosen + 1, [...amts, k])
    }
    rec(0, 0, [])
    return res.map((amts) => amts.concat(Array(n - amts.length).fill(0)))
  },
  apply: (s, amts) => ({ a: s.a.map((x, i) => x - amts[i]), t: 1 - s.t }),
  key: (s) => `${sortNum(s.a)}|${s.t}`,
  label: (s, amts) => amts.map((k, i) => (k ? `${k} from pile ${i + 1}` : null)).filter(Boolean).join(', '),
  board: 'thanos',
}

export const marbles = {
  id: 'game-with-marbles',
  title: 'Game with Marbles',
  cf: cf(1914, 'E1', 'Game with Marbles (Easy Version)', 1400),
  roles: ['Alice', 'Bob'],
  kind: 'score',
  scoreLabel: 'A − B (marbles left)',
  rules:
    'Alice and Bob own marbles of several colours. On each turn a player picks a colour that both still own: they discard one of their own marbles of it and the opponent discards ALL of theirs. The game ends when no colour is owned by both. The score is (Alice\'s marbles − Bob\'s marbles). Alice maximises it and Bob minimises it. Alice moves first.',
  generate: (rng, tier) => {
    const n = tier3(tier, 3, 4, 6)
    return { a: rng.array(n, 1, 6), b: rng.array(n, 1, 6), t: 0 }
  },
  turn: n1,
  moves: (s) => s.a.map((x, i) => (x > 0 && s.b[i] > 0 ? i : -1)).filter((i) => i >= 0),
  apply: (s, i) => {
    const a = s.a.slice()
    const b = s.b.slice()
    if (s.t === 0) {
      a[i]--
      b[i] = 0
    } else {
      b[i]--
      a[i] = 0
    }
    return { a, b, t: 1 - s.t }
  },
  outcome: (s) => sum(s.a) - sum(s.b),
  label: (s, i) => `colour ${i + 1}`,
  board: 'marbles',
}
