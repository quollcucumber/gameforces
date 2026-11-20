import { test } from 'node:test'
import assert from 'node:assert'
import { MAX_DELTA, ratingDelta, scoreOf } from '../src/engine/elo.js'
import { botRating } from '../src/engine/setup.js'
import { GAME_BY_ID } from '../src/games/index.js'

test('harder bots give more rating for a win', () => {
  const easy = GAME_BY_ID['01-game']
  const hard = GAME_BY_ID['colouring-game']
  assert.ok(botRating(hard, 2) > botRating(hard, 0))
  assert.ok(ratingDelta(1500, botRating(hard, 1), 1, 20) > ratingDelta(1500, botRating(easy, 1), 1, 20))
})

test('deltas are capped and symmetric in sign', () => {
  assert.ok(ratingDelta(1200, 3500, 1, 0) <= MAX_DELTA)
  assert.ok(ratingDelta(1200, 1200, 0, 50) < 0)
  assert.strictEqual(scoreOf('draw'), 0.5)
})
