// Exact minimax over a game's state graph. Player 0 maximises the outcome, player 1 minimises it.
// Outcomes are numbers from player 0's point of view (+1 / -1 / 0 for win games, a score otherwise).

export class TooBig extends Error {}

export function isTerminal(game, s) {
  return terminalValue(game, s) !== null
}

export function terminalValue(game, s) {
  if (game.terminal) {
    const t = game.terminal(s)
    if (t !== null && t !== undefined) return t
  }
  if (game.moves(s).length === 0) {
    if (game.outcome) return game.outcome(s)
    return game.turn(s) === 0 ? -1 : 1
  }
  return null
}

// `deadline` (a Date.now() value) aborts long solves with TooBig too, so the page never freezes for long.
export function makeSolver(game, limit = 400000, deadline = Infinity) {
  return game.cyclic ? makeRetrogradeSolver(game, limit, deadline) : makeMinimaxSolver(game, limit, deadline)
}

function makeMinimaxSolver(game, limit, deadline) {
  const memo = new Map()
  const key = game.key || ((s) => JSON.stringify(s))
  function value(s) {
    const k = key(s)
    const hit = memo.get(k)
    if (hit !== undefined) return hit
    let v = terminalValue(game, s)
    if (v === null && game.wins) v = game.wins(s) === (game.turn(s) === 0) ? 1 : -1
    if (v === null) {
      const maxim = game.turn(s) === 0
      v = maxim ? -Infinity : Infinity
      for (const m of (game.solverMoves || game.moves)(s)) {
        const c = value(game.apply(s, m))
        if (maxim ? c > v : c < v) v = c
      }
    }
    memo.set(k, v)
    if (memo.size > limit || ((memo.size & 4095) === 0 && Date.now() > deadline)) throw new TooBig()
    return v
  }
  function analyse(s) {
    return (game.solverMoves || game.moves)(s).map((m) => ({ move: m, value: value(game.apply(s, m)) }))
  }
  return { value, analyse, size: () => memo.size }
}

function better(turn, a, b) {
  return turn === 0 ? a > b : a < b
}

// Optimal move; among equally good moves prefer the one that leaves the opponent the fewest good replies.
export function botMove(game, solver, s, rng = Math.random) {
  const turn = game.turn(s)
  const options = solver.analyse(s)
  let best = options[0].value
  for (const o of options) if (better(turn, o.value, best)) best = o.value
  const top = options.filter((o) => o.value === best)
  if (game.cyclic) {
    const winning = turn === 0 ? best > 0 : best < 0
    const d = top.map((o) => o.depth)
    const target = winning ? Math.min(...d) : Math.max(...d)
    const picks = top.filter((o) => o.depth === target)
    return picks[Math.floor(rng() * picks.length)].move
  }
  let fewest = Infinity
  let picks = []
  for (const o of top) {
    const child = game.apply(s, o.move)
    let replies = 0
    if (terminalValue(game, child) === null) {
      const opp = game.turn(child)
      const r = solver.analyse(child)
      let ob = r[0].value
      for (const x of r) if (better(opp, x.value, ob)) ob = x.value
      replies = r.filter((x) => x.value === ob).length
    }
    if (replies < fewest) {
      fewest = replies
      picks = [o]
    } else if (replies === fewest) picks.push(o)
  }
  return picks[Math.floor(rng() * picks.length)].move
}

export function bestValue(turn, values) {
  let b = values[0]
  for (const v of values) if (better(turn, v, b)) b = v
  return b
}

// Win/lose games whose state graph has cycles: retrograde analysis over the reachable states.
// Positions that neither side can force are draws (0). depth = plies to the end under optimal play.
function makeRetrogradeSolver(game, limit, deadline) {
  const key = game.key || ((s) => JSON.stringify(s))
  const info = new Map()
  function build(root) {
    const rk = key(root)
    if (info.has(rk)) return
    const stack = [root]
    const fresh = []
    info.set(rk, { state: root, parents: [], value: null, depth: 0, left: 0 })
    while (stack.length) {
      const s = stack.pop()
      const k = key(s)
      const node = info.get(k)
      fresh.push(k)
      const t = terminalValue(game, s)
      if (t !== null) {
        node.value = t
        continue
      }
      const kids = game.moves(s).map((m) => game.apply(s, m))
      node.left = kids.length
      for (const c of kids) {
        const ck = key(c)
        let cn = info.get(ck)
        if (!cn) {
          cn = { state: c, parents: [], value: null, depth: 0, left: 0 }
          info.set(ck, cn)
          stack.push(c)
          if (info.size > limit || ((info.size & 4095) === 0 && Date.now() > deadline)) throw new TooBig()
        }
        cn.parents.push(k)
      }
    }
    const queue = fresh.filter((k) => info.get(k).value !== null)
    for (let qi = 0; qi < queue.length; qi++) {
      const cn = info.get(queue[qi])
      for (const pk of cn.parents) {
        const pn = info.get(pk)
        if (pn.value !== null) continue
        const pturn = game.turn(pn.state)
        const good = pturn === 0 ? cn.value > 0 : cn.value < 0
        if (good) {
          pn.value = cn.value
          pn.depth = cn.depth + 1
          queue.push(pk)
        } else if (--pn.left === 0) {
          pn.value = cn.value
          pn.depth = cn.depth + 1
          queue.push(pk)
        }
      }
    }
    for (const k of fresh) {
      const n = info.get(k)
      if (n.value === null) n.value = 0
    }
  }
  function node(s) {
    build(s)
    return info.get(key(s))
  }
  return {
    value: (s) => node(s).value,
    depth: (s) => node(s).depth,
    analyse: (s) => game.moves(s).map((m) => {
      const n = node(game.apply(s, m))
      return { move: m, value: n.value, depth: n.depth }
    }),
    size: () => info.size,
  }
}
