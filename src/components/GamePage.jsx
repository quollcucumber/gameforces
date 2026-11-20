import { useEffect, useRef, useState } from 'react'
import { ratingDelta } from '../engine/elo.js'
import { randomSeed } from '../engine/rng.js'
import { TIERS, botRating, makePosition, resultFor, winningSeat } from '../engine/setup.js'
import { botMove, terminalValue } from '../engine/solver.js'
import { cfUrl } from '../games/index.js'
import { firebaseConfigured } from '../lib/firebase.js'
import { go } from '../lib/route.js'
import { createMatch, recordResult, signIn } from '../lib/store.js'
import { History, Moves, Result, Table, fmtValue } from './Play.jsx'

const later = (f) => new Promise((res, rej) => setTimeout(() => { try { res(f()) } catch (e) { rej(e) } }, 20))

export default function GamePage({ game, user, profile }) {
  const [tier, setTier] = useState(1)
  const [g, setG] = useState(null)
  const [busy, setBusy] = useState(false)
  const [delta, setDelta] = useState(null)
  const recorded = useRef(null)

  const s = g && g.s
  const outcome = g && (g.resigned ? null : terminalValue(game, s))
  const over = g && (g.resigned || outcome !== null)
  const turn = g && !over ? game.turn(s) : null
  const result = over ? (g.resigned ? 'loss' : resultFor(game, g.seat, outcome, g.value, true)) : null
  const oppRating = botRating(game, tier)

  const start = async () => {
    setBusy(true)
    setDelta(null)
    const seed = randomSeed()
    const p = await later(() => makePosition(game, tier, seed))
    setG({ seed, tier, value: p.value, solver: p.solver, seat: winningSeat(game, p.value), s: p.state, history: [], resigned: false })
    setBusy(false)
  }

  const play = (m) =>
    setG((cur) => {
      const child = game.apply(cur.s, m)
      const optimal = cur.solver.value(child) === cur.solver.value(cur.s)
      const entry = { seat: game.turn(cur.s), label: game.label(cur.s, m), optimal }
      return { ...cur, s: child, history: [...cur.history, entry] }
    })

  useEffect(() => {
    if (!g || over || turn === g.seat) return
    const id = setTimeout(() => play(botMove(game, g.solver, g.s)), 550)
    return () => clearTimeout(id)
  })

  useEffect(() => {
    if (!over || recorded.current === g.seed) return
    recorded.current = g.seed
    recordResult(user, { id: `bot-${g.seed}`, gameId: game.id, opponent: 'bot', oppRating: botRating(game, g.tier), result })
      .then(setDelta)
      .catch((e) => console.error(e))
  })

  const challenge = async () => {
    setBusy(true)
    try {
      const seed = randomSeed()
      const p = await later(() => makePosition(game, tier, seed))
      const id = await createMatch(user, profile, { gameId: game.id, tier, seed, seat: Math.random() < 0.5 ? 0 : 1, init: p.state, value: p.value })
      go(`/match/${id}`)
    } catch (e) {
      alert(e.message)
      setBusy(false)
    }
  }

  const names = g ? (g.seat === 0 ? ['You', 'Bot'] : ['Bot', 'You']) : ['', '']
  const r = profile ? profile.rating : 1200
  const n = profile ? profile.games : 0

  return (
    <div className="game-page">
      <div className="head">
        <h1>{game.title}</h1>
        <a href={cfUrl(game)} target="_blank" rel="noreferrer" className="cf-link">
          Codeforces {game.cf.contest}
          {game.cf.index} · rated {game.cf.rating}
        </a>
      </div>
      <p className="rules">{game.rules}</p>

      <div className="controls">
        <div className="tiers">
          {TIERS.map((t) => (
            <button key={t.id} className={tier === t.id ? 'on' : 'ghost'} onClick={() => setTier(t.id)} disabled={busy || (g && !over)}>
              {t.name}
              <small>bot {botRating(game, t.id)}</small>
            </button>
          ))}
        </div>
        <button onClick={start} disabled={busy || (g && !over)}>
          {busy ? 'Solving…' : g ? 'New game vs bot' : 'Play the bot'}
        </button>
        {firebaseConfigured &&
          (user ? (
            <button className="ghost" onClick={challenge} disabled={busy || (g && !over)}>
              Challenge a friend
            </button>
          ) : (
            <button className="ghost" onClick={() => signIn().catch((e) => alert(e.message))}>
              Sign in to challenge a friend
            </button>
          ))}
        <span className="muted">
          vs bot: win +{ratingDelta(r, oppRating, 1, n)}, lose {ratingDelta(r, oppRating, 0, n)}
        </span>
      </div>

      {g && (
        <Table game={game} state={s} names={names} mySeat={g.seat} turn={turn}>
          <p className="goal">
            You play <b>{game.roles[g.seat]}</b>.{' '}
            {game.kind === 'win'
              ? 'This position is a forced win for you.'
              : `With perfect play, ${game.scoreLabel || 'the score'} ends at ${fmtValue(game, g.value, s)}. Match it to win.`}
          </p>
          {over ? (
            <Result result={result} delta={delta}>
              {game.kind === 'score' && !g.resigned && (
                <span className="muted">
                  {game.scoreLabel || 'Score'}: {fmtValue(game, outcome, s)} (best {fmtValue(game, g.value, s)})
                </span>
              )}
            </Result>
          ) : turn === g.seat ? (
            <>
              <Moves game={game} state={s} onMove={play} />
              <button className="danger small" onClick={() => setG({ ...g, resigned: true })}>
                Resign
              </button>
            </>
          ) : (
            <p className="muted thinking">Bot is thinking…</p>
          )}
          <History game={game} history={g.history} names={names} review={over} />
        </Table>
      )}
    </div>
  )
}
