import { makeRng } from './rng.js'
import { makeSolver, TooBig, terminalValue } from './solver.js'

export const TIERS = [
  { id: 0, name: 'Easy', offset: -300 },
  { id: 1, name: 'Medium', offset: 0 },
  { id: 2, name: 'Hard', offset: 300 },
]

export function botRating(game, tier) {
  return Math.max(400, (game.cf.rating || 1500) + TIERS[tier].offset)
}

// Generates a solved position. With seat === 'winning' the human gets a side that can force the outcome.
export function makePosition(game, tier, seed) {
  const rng = makeRng(seed)
  for (let attempt = 0; attempt < 200; attempt++) {
    const t = attempt < 120 ? tier : Math.max(0, tier - 1 - Math.floor((attempt - 120) / 40))
    const state = game.generate(rng, t)
    if (terminalValue(game, state) !== null) continue
    const solver = makeSolver(game)
    let value
    try {
      value = solver.value(state)
    } catch (e) {
      if (e instanceof TooBig) continue
      throw e
    }
    if (game.kind === 'win' && value === 0) continue
    if (game.validate && !game.validate(state, value)) continue
    return { state, value, solver }
  }
  throw new Error(`Could not generate a position for ${game.id}`)
}

// The seat that can force the game value: for win games the winner, for score games either side.
export function winningSeat(game, value, rng = Math.random) {
  if (game.kind === 'win') return value > 0 ? 0 : 1
  return rng() < 0.5 ? 0 : 1
}

// Result for `seat`. Against the bot the human always has a forced win, so a draw counts as a loss. Score games have no natural winner: the side that beats the game value wins and an
// exact match is a draw, except against the (perfect) bot where matching the value is a win.
export function resultFor(game, seat, outcome, value, vsBot = false) {
  if (game.kind === 'win') {
    if (outcome === 0) return vsBot ? 'loss' : 'draw'
    return (outcome > 0) === (seat === 0) ? 'win' : 'loss'
  }
  const diff = seat === 0 ? outcome - value : value - outcome
  if (diff > 0) return 'win'
  if (diff < 0) return 'loss'
  return vsBot ? 'win' : 'draw'
}
