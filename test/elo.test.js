import { test } from 'node:test'
import assert from 'node:assert'
import { BOT_MIN_LOSS, MAX_DELTA, ratingDelta, scoreOf } from '../src/engine/elo.js'
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

test('losing to the bot always costs at least BOT_MIN_LOSS', () => {
  assert.equal(ratingDelta(1200, 3500, 0, 20), 0)
  assert.strictEqual(ratingDelta(1200, 3500, 0, 20, true), -BOT_MIN_LOSS)
  assert.ok(ratingDelta(2400, 1000, 0, 20, true) < -BOT_MIN_LOSS)
})
