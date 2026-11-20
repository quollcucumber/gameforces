import { test } from 'node:test'
import assert from 'node:assert'
import { GAMES, maxTier } from '../src/games/index.js'
import { makePosition, winningSeat, resultFor } from '../src/engine/setup.js'
import { botMove, terminalValue } from '../src/engine/solver.js'
import { makeRng } from '../src/engine/rng.js'

// Bot vs bot from the generated position must realise the solved value, for every game and tier.
for (const g of GAMES) {
  test(`${g.id} positions are solvable and bots reach the game value`, () => {
    const ids = new Set()
    for (let tier = 0; tier <= maxTier(g); tier++) {
      for (const seed of tier > 2 ? [1] : [1, 2, 3]) {
        const t0 = Date.now()
        const { state, value, solver } = makePosition(g, tier, seed * 7919 + tier)
        assert.ok(Date.now() - t0 < (tier > 2 ? 8000 : 4000), `${g.id} tier ${tier} too slow`)
        assert.strictEqual(makePosition(g, tier, seed * 7919 + tier).tier, tier, `${g.id} fell back from tier ${tier}`)
        if (g.kind === 'win') assert.notStrictEqual(value, 0)
        ids.add(JSON.stringify(state))
        let s = state
        const rng = makeRng(seed).next
        let plies = 0
        while (terminalValue(g, s) === null && plies < 500) {
          const m = botMove(g, solver, s, rng)
          assert.ok(g.moves(s).some((x) => JSON.stringify(x) === JSON.stringify(m)), 'bot move must be legal')
          s = g.apply(s, m)
          plies++
        }
        const out = terminalValue(g, s)
        assert.strictEqual(out, value, `${g.id}: bot-vs-bot outcome ${out} != value ${value}`)
        const seat = winningSeat(g, value, () => 0.3)
        assert.strictEqual(resultFor(g, seat, out, value, true), 'win')
      }
    }
  })
}

test('game ids are unique', () => {
  assert.strictEqual(new Set(GAMES.map((g) => g.id)).size, GAMES.length)
})
