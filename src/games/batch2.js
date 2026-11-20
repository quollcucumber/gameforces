import { cf, tier3, sortNum, divisors, winnerSign, sum } from './util.js'

const n1 = (s) => s.t
const gcd = (a, b) => (b ? gcd(b, a % b) : a)

const strRank = (str) => [...str].reduce((v, c) => v * 26 + (c.charCodeAt(0) - 97), 0)
const rankStr = (v, n) => {
  let r = ''
  for (let i = 0; i < n; i++) {
    r = String.fromCharCode(97 + (v % 26)) + r
    v = Math.floor(v / 26)
  }
  return r
}
const ABC = 'abcdefghijklmnopqrstuvwxyz'
export const stringGame = {
  id: 'yet-another-string-game',
  title: 'Yet Another String Game',
  cf: cf(1480, 'A', 'Yet Another String Game', 800),
  roles: ['Alice', 'Bob'],
  kind: 'score',
  scoreLabel: 'final string (Alice wants it small)',
  rules:
    'There is a string of lowercase letters. On each turn a player picks a position nobody has picked yet and changes its letter to a different one. The game ends when every position has been picked. Alice wants the final string lexicographically as SMALL as possible and Bob wants it as LARGE as possible. Alice moves first.',
  generate: (rng, tier) => ({ s: rng.str(tier3(tier, 3, 4, 6), 'abcxyz' + ABC), used: '', t: 0 }),
  turn: n1,
  moves: (s) => {
    const r = []
    for (let i = 0; i < s.s.length; i++) if (!s.used.includes(i)) for (const c of ABC) if (c !== s.s[i]) r.push([i, c])
    return r
  },
  solverMoves: (s) => {
    const r = []
    for (let i = 0; i < s.s.length; i++) {
      if (s.used.includes(i)) continue
      const order = s.t === 0 ? ABC : [...ABC].reverse().join('')
      r.push([i, [...order].find((c) => c !== s.s[i])])
    }
    return r
  },
  apply: (s, [i, c]) => ({ s: s.s.slice(0, i) + c + s.s.slice(i + 1), used: s.used + i, t: 1 - s.t }),
  terminal: (s) => (s.used.length === s.s.length ? -strRank(s.s) : null),
  formatValue: (v, s) => `"${rankStr(-v, s.s.length)}"`,
  label: (s, [i, c]) => `position ${i + 1}: ${s.s[i]} → ${c}`,
  board: 'stringGame',
}

export const tokitsukaze = {
  id: 'tokitsukaze-stone-game',
  title: 'Tokitsukaze, CSL and Stone Game',
  cf: cf(1190, 'B', 'Tokitsukaze, CSL and Stone Game', 1800),
  roles: ['Tokitsukaze', 'CSL'],
  kind: 'win',
  rules:
    'There are piles of stones. On each turn a player removes exactly one stone from a non-empty pile. A player loses if every pile is empty before their turn, or if after their move two piles (possibly empty ones) have the same size. Tokitsukaze moves first.',
  generate: (rng, tier) => ({ a: rng.array(tier3(tier, 2, 3, 4), 0, tier3(tier, 5, 6, 7)), t: 0, lost: false }),
  validate: (s) => tokitsukaze.moves(s).some((i) => !tokitsukaze.apply(s, i).lost),
  turn: n1,
  terminal: (s) => (s.lost ? winnerSign(s.t) : null),
  moves: (s) => s.a.map((x, i) => (x > 0 ? i : -1)).filter((i) => i >= 0),
  apply: (s, i) => {
    const a = s.a.slice()
    a[i]--
    return { a, t: 1 - s.t, lost: new Set(a).size < a.length }
  },
  key: (s) => `${sortNum(s.a)}|${s.t}|${s.lost}`,
  label: (s, i) => `take from pile ${i + 1}`,
  board: 'piles1',
}

export const ticketGame = {
  id: 'ticket-game',
  title: 'Ticket Game',
  cf: cf(1215, 'D', 'Ticket Game', 1700),
  roles: ['Monocarp', 'Bicarp'],
  kind: 'win',
  rules:
    'A ticket has an even number of digits, and an even number of them are erased (?). On each turn a player replaces one ? with any digit 0–9. When no ? is left, the ticket is happy if the digit sum of the first half equals that of the second half. Bicarp wins if it is happy and Monocarp wins otherwise. Monocarp moves first.',
  generate: (rng, tier) => {
    const n = tier3(tier, 4, 6, 8)
    const q = tier3(tier, 2, 2, 4)
    const d = [...rng.str(n, '0123456789')]
    for (const i of rng.shuffle(d.map((_, i) => i)).slice(0, q)) d[i] = '?'
    return { d: d.join(''), t: 0 }
  },
  turn: n1,
  moves: (s) => {
    const r = []
    ;[...s.d].forEach((c, i) => c === '?' && [...'0123456789'].forEach((x) => r.push([i, x])))
    return r
  },
  apply: (s, [i, x]) => ({ d: s.d.slice(0, i) + x + s.d.slice(i + 1), t: 1 - s.t }),
  outcome: (s) => {
    const h = s.d.length / 2
    const f = (str) => sum([...str].map(Number))
    return f(s.d.slice(0, h)) === f(s.d.slice(h)) ? -1 : 1
  },
  key: (s) => {
    const h = s.d.length / 2
    let diff = 0
    let ql = 0
    let qr = 0
    ;[...s.d].forEach((c, i) => {
      if (c === '?') {
        if (i < h) ql++
        else qr++
      } else diff += i < h ? Number(c) : -Number(c)
    })
    return `${diff}|${ql}|${qr}|${s.t}`
  },
  label: (s, [i, x]) => `digit ${i + 1} := ${x}`,
  board: 'ticket',
}

export const pieRules = {
  id: 'pie-rules',
  title: 'Pie Rules',
  cf: cf(859, 'C', 'Pie Rules', 1500),
  roles: ['Alice', 'Bob'],
  kind: 'score',
  scoreLabel: 'pie Alice eats',
  rules:
    'Slices of pie are handed out in a fixed order. Whoever holds the "decider" token (Bob at the start) gives the next slice to one player and the token to the other. So you either take the slice and give away the token, or give away the slice and keep the token. Each player wants to eat as much pie as possible.',
  generate: (rng, tier) => ({ p: rng.array(tier3(tier, 4, 6, 9), 1, 9), i: 0, dec: 1, got: [0, 0] }),
  turn: (s) => s.dec,
  moves: (s) => (s.i < s.p.length ? ['take', 'give'] : []),
  apply: (s, m) => {
    const got = s.got.slice()
    const me = s.dec
    const eater = m === 'take' ? me : 1 - me
    got[eater] += s.p[s.i]
    return { p: s.p, i: s.i + 1, dec: m === 'take' ? 1 - me : me, got }
  },
  outcome: (s) => s.got[0],
  label: (s, m) => (m === 'take' ? `eat slice ${s.p[s.i]}, give token` : `give slice ${s.p[s.i]} away, keep token`),
  board: 'pie',
}

export const gameGame = {
  id: 'gamegame',
  title: 'GameGame',
  cf: cf(1383, 'B', 'GameGame', 1900),
  roles: ['Koa', 'Friend'],
  kind: 'win',
  rules:
    'There is an array of non-negative integers, and both scores start at 0. On each turn a player removes any element and XORs it into their own score. When the array is empty, the higher score wins (equal is a draw). Koa moves first.',
  generate: (rng, tier) => ({ a: sortNum(rng.array(tier3(tier, 4, 6, 8), 0, tier3(tier, 7, 15, 31))), sc: [0, 0], t: 0 }),
  turn: n1,
  moves: (s) => [...new Set(s.a)],
  apply: (s, v) => {
    const a = s.a.slice()
    a.splice(a.indexOf(v), 1)
    const sc = s.sc.slice()
    sc[s.t] ^= v
    return { a, sc, t: 1 - s.t }
  },
  outcome: (s) => Math.sign(s.sc[0] - s.sc[1]),
  label: (s, v) => `take ${v}`,
  board: 'xor',
}

export const lotOfGames = {
  id: 'a-lot-of-games',
  title: 'A Lot of Games',
  cf: cf(455, 'B', 'A Lot of Games', 1900),
  roles: ['First', 'Second'],
  kind: 'win',
  rules:
    'There is a list of words, and the players build a word together, starting empty. On each turn a player adds one letter to the end, and the result must be a prefix of at least one word in the list. A player who cannot move loses. First moves first. (This is one game of the original k-game match.)',
  generate: (rng, tier) => {
    const w = new Set()
    const cnt = tier3(tier, 3, 4, 6)
    while (w.size < cnt) w.add(rng.str(rng.int(1, tier3(tier, 4, 5, 7)), tier3(tier, 'ab', 'abc', 'abc')))
    return { words: [...w].sort(), w: '', t: 0 }
  },
  turn: n1,
  moves: (s) => [...new Set(s.words.filter((x) => x.length > s.w.length && x.startsWith(s.w)).map((x) => x[s.w.length]))].sort(),
  apply: (s, c) => ({ words: s.words, w: s.w + c, t: 1 - s.t }),
  key: (s) => `${s.w}|${s.t}`,
  label: (s, c) => `add ${c}`,
  board: 'words',
}

export const madmax = {
  id: 'madmax',
  title: 'MADMAX',
  cf: cf(917, 'B', 'MADMAX', 1700),
  roles: ['Max', 'Lucas'],
  kind: 'win',
  rules:
    'The board is a directed acyclic graph with a letter on each edge, and each player has a marble on a vertex. On their turn a player moves their own marble along an outgoing edge. Each move\'s letter must be ≥ the letter of the previous move, by either player. A player who cannot move loses. Max moves first.',
  generate: (rng, tier) => {
    const n = tier3(tier, 5, 6, 8)
    const edges = []
    for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) if (rng.next() < tier3(tier, 0.4, 0.4, 0.35)) edges.push([u, v, rng.pick(tier3(tier, 'abc', 'abcd', 'abcde'))])
    return { n, edges, p: [rng.int(0, n - 2), rng.int(0, n - 2)], last: 'a', t: 0 }
  },
  turn: n1,
  moves: (s) => s.edges.map((e, i) => (e[0] === s.p[s.t] && e[2] >= s.last ? i : -1)).filter((i) => i >= 0),
  apply: (s, i) => {
    const p = s.p.slice()
    p[s.t] = s.edges[i][1]
    return { ...s, p, last: s.edges[i][2], t: 1 - s.t }
  },
  key: (s) => `${s.p}|${s.last}|${s.t}`,
  label: (s, i) => `${s.edges[i][0] + 1} → ${s.edges[i][1] + 1} (${s.edges[i][2]})`,
  board: 'dag',
}

export const gameOfStones = {
  id: 'game-of-stones',
  title: 'Game of Stones',
  cf: cf(768, 'E', 'Game of Stones', 2100),
  roles: ['Sam', 'Jon'],
  kind: 'win',
  rules:
    'There are piles of stones. On each turn a player removes some stones from one pile, but each amount can be removed from a given pile at most once. For example, after 4 stones are taken from a pile, nobody can take exactly 4 from that pile again. A player who cannot move loses. Sam moves first.',
  generate: (rng, tier) => ({ a: rng.array(tier3(tier, 2, 2, 3), 1, tier3(tier, 6, 9, 8)), used: [], t: 0 }),
  turn: n1,
  moves: (s) => {
    const r = []
    s.a.forEach((x, i) => {
      for (let k = 1; k <= x; k++) if (!(s.used[i] || []).includes(k)) r.push([i, k])
    })
    return r
  },
  apply: (s, [i, k]) => {
    const a = s.a.slice()
    a[i] -= k
    const used = s.a.map((_, j) => (s.used[j] || []).slice())
    used[i].push(k)
    return { a, used, t: 1 - s.t }
  },
  key: (s) => `${s.a.map((x, i) => `${x}:${sortNum((s.used[i] || []).filter((k) => k <= x))}`).sort()}|${s.t}`,
  label: (s, [i, k]) => `take ${k} from pile ${i + 1}`,
  board: 'stones',
}

export const lieges = {
  id: 'lieges-of-legendre',
  title: 'Lieges of Legendre',
  cf: cf(603, 'C', 'Lieges of Legendre', 2200),
  roles: ['Kevin', 'Nicky'],
  kind: 'win',
  rules:
    'There are piles of cows and a number k. On each turn a player either removes one cow from a pile, or replaces a pile of even size 2x with k piles of x cows each. Whoever removes the last cow wins. Kevin moves first.',
  generate: (rng, tier) => ({ a: rng.array(tier3(tier, 1, 2, 3), 1, tier3(tier, 6, 8, 8)), k: rng.int(1, 3), t: 0 }),
  turn: n1,
  moves: (s) => {
    const r = []
    const seen = new Set()
    s.a.forEach((x, i) => {
      if (seen.has(x)) return
      seen.add(x)
      if (x > 0) r.push([i, 'remove'])
      if (x > 0 && x % 2 === 0) r.push([i, 'split'])
    })
    return r
  },
  apply: (s, [i, m]) => {
    const a = s.a.slice()
    if (m === 'remove') a[i]--
    else a.splice(i, 1, ...Array(s.k).fill(a[i] / 2))
    return { a: a.filter((x) => x > 0), k: s.k, t: 1 - s.t }
  },
  key: (s) => `${sortNum(s.a)}|${s.k}|${s.t}`,
  label: (s, [i, m]) => (m === 'remove' ? `remove a cow from pile of ${s.a[i]}` : `split ${s.a[i]} into ${s.k}×${s.a[i] / 2}`),
  board: 'lieges',
}

export const beaverGame = {
  id: 'beaver-game',
  title: 'Beaver Game',
  cf: cf(78, 'C', 'Beaver Game', 2000),
  roles: ['Timur', 'Marsel'],
  kind: 'win',
  rules:
    'There are logs of integer length and a minimum length k. On each turn a player gnaws one log into two or more equal parts, each of integer length at least k. A player who cannot move loses. Timur moves first.',
  generate: (rng, tier) => ({ a: Array(rng.int(1, tier3(tier, 2, 3, 4))).fill(rng.int(4, tier3(tier, 24, 48, 96))), k: rng.int(1, 4), t: 0 }),
  turn: n1,
  moves: (s) => {
    const r = []
    for (const x of new Set(s.a)) for (const parts of divisors(x)) if (parts > 1 && x / parts >= s.k) r.push([x, parts])
    return r
  },
  apply: (s, [x, parts]) => {
    const a = s.a.slice()
    a.splice(a.indexOf(x), 1, ...Array(parts).fill(x / parts))
    return { a: sortNum(a), k: s.k, t: 1 - s.t }
  },
  // Equal pairs of logs cancel out (mirror strategy), and logs shorter than 2k are dead.
  key: (s) => {
    const odd = new Set()
    for (const x of s.a) {
      if (x < 2 * s.k) continue
      if (odd.has(x)) odd.delete(x)
      else odd.add(x)
    }
    return `${sortNum([...odd])}|${s.k}|${s.t}`
  },
  label: (s, [x, parts]) => `cut ${x} into ${parts}×${x / parts}`,
  board: 'logs',
}

export const interestingGame = {
  id: 'interesting-game',
  title: 'Interesting Game',
  cf: cf(87, 'C', 'Interesting Game', 2000),
  roles: ['Serozha', 'Gena'],
  kind: 'win',
  rules:
    'There is one pile of n stones. On each turn a player splits one pile into k ≥ 2 piles whose sizes are consecutive integers, like 4+3+2 = 9. A player who cannot move loses. Serozha moves first.',
  generate: (rng, tier) => ({ a: [rng.int(3, tier3(tier, 15, 30, 45))], t: 0 }),
  turn: n1,
  moves: (s) => {
    const r = []
    for (const x of new Set(s.a))
      for (let k = 2; (k * (k + 1)) / 2 <= x; k++) {
        const rem = x - (k * (k - 1)) / 2
        if (rem % k === 0 && rem / k > 0) r.push([x, k])
      }
    return r
  },
  apply: (s, [x, k]) => {
    const lo = (x - (k * (k - 1)) / 2) / k
    const a = s.a.slice()
    a.splice(a.indexOf(x), 1, ...Array.from({ length: k }, (_, i) => lo + i))
    return { a: sortNum(a.filter((y) => y >= 1)), t: 1 - s.t }
  },
  key: (s) => `${sortNum(s.a.filter((x) => x >= 3))}|${s.t}`,
  label: (s, [x, k]) => {
    const lo = (x - (k * (k - 1)) / 2) / k
    return `split ${x} = ${Array.from({ length: k }, (_, i) => lo + k - 1 - i).join('+')}`
  },
  board: 'logs',
}

export const notNim = {
  id: 'not-a-nim-problem',
  title: 'Not a Nim Problem',
  cf: cf(2004, 'E', 'Not a Nim Problem', 2100),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'There are piles of stones. On each turn a player takes y > 0 stones from a pile that currently has x stones, but only if gcd(x, y) = 1. A player who cannot move loses. Alice moves first.',
  generate: (rng, tier) => ({ a: rng.array(tier3(tier, 2, 3, 4), 1, tier3(tier, 8, 12, 15)), t: 0 }),
  turn: n1,
  moves: (s) => {
    const r = []
    s.a.forEach((x, i) => {
      for (let y = 1; y <= x; y++) if (gcd(x, y) === 1) r.push([i, y])
    })
    return r
  },
  apply: (s, [i, y]) => {
    const a = s.a.slice()
    a[i] -= y
    return { a, t: 1 - s.t }
  },
  key: (s) => `${sortNum(s.a)}|${s.t}`,
  label: (s, [i, y]) => `take ${y} from pile ${i + 1}`,
  board: 'gcdPiles',
}

export const aliceAndBob = {
  id: 'alice-and-bob-differences',
  title: 'Alice and Bob',
  cf: cf(346, 'A', 'Alice and Bob', 1600),
  roles: ['Alice', 'Bob'],
  kind: 'win',
  rules:
    'There is a set of distinct integers. On each turn a player picks two numbers x and y from the set whose difference |x − y| is not yet in the set, and adds that difference. A player who cannot move loses. Alice moves first.',
  generate: (rng, tier) => {
    const set = new Set()
    const n = tier3(tier, 2, 3, 3)
    while (set.size < n) set.add(rng.int(1, tier3(tier, 10, 14, 20)))
    return { a: sortNum([...set]), t: 0 }
  },
  turn: n1,
  moves: (s) => {
    const r = new Set()
    for (const x of s.a) for (const y of s.a) if (x > y && !s.a.includes(x - y)) r.add(x - y)
    return sortNum([...r])
  },
  apply: (s, d) => ({ a: sortNum([...s.a, d]), t: 1 - s.t }),
  label: (s, d) => `add ${d}`,
  board: 'differences',
}

export const winOrFreeze = {
  id: 'win-or-freeze',
  title: 'Win or Freeze',
  cf: cf(150, 'A', 'Win or Freeze', 1400),
  roles: ['First', 'Second'],
  kind: 'win',
  rules:
    'A number q is written down. On each turn a player writes a non-trivial divisor of the last number written, meaning a divisor other than 1 and the number itself. The first player who CANNOT move wins (they stay in bed). First moves first.',
  generate: (rng, tier) => ({ q: rng.int(4, tier3(tier, 100, 2000, 100000)), t: 0 }),
  turn: n1,
  moves: (s) => divisors(s.q).filter((d) => d !== 1 && d !== s.q),
  apply: (s, d) => ({ q: d, t: 1 - s.t }),
  outcome: (s) => winnerSign(s.t),
  label: (s, d) => `write ${d}`,
  board: 'divisor',
}
