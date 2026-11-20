import { useEffect, useMemo, useRef, useState } from 'react'
import { resultFor } from '../engine/setup.js'
import { terminalValue } from '../engine/solver.js'
import { GAME_BY_ID, cfUrl } from '../games/index.js'
import { firebaseConfigured } from '../lib/firebase.js'
import { go } from '../lib/route.js'
import { joinMatch, pushMove, recordResult, resignMatch, useMatch } from '../lib/store.js'
import { History, Moves, Result, Table, fmtValue } from './Play.jsx'

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// Replays the stored moves from the initial position, checking each one is legal.
function replay(game, m) {
  let s = JSON.parse(m.init)
  const history = []
  for (const raw of m.moves) {
    const mv = JSON.parse(raw)
    if (terminalValue(game, s) !== null || !game.moves(s).some((x) => same(x, mv))) return { s, history, invalid: true }
    history.push({ seat: game.turn(s), label: game.label(s, mv) })
    s = game.apply(s, mv)
  }
  return { s, history, invalid: false }
}

export default function MatchPage({ id, user, profile }) {
  const m = useMatch(id)
  const [busy, setBusy] = useState(false)
  const [delta, setDelta] = useState(null)
  const [copied, setCopied] = useState(false)
  const recorded = useRef(false)
  const game = m && GAME_BY_ID[m.gameId]
  const rep = useMemo(() => (game ? replay(game, m) : null), [game, m])

  const uid = user && user.uid
  const mySeat = m && uid ? m.seats.indexOf(uid) : -1
  const outcome = rep && !rep.invalid ? terminalValue(game, rep.s) : null
  const resigned = m && m.resigned !== undefined ? m.resigned : null
  const over = m && (m.status === 'done' || outcome !== null || resigned !== null)
  const turn = rep && !over ? game.turn(rep.s) : null
  let result = null
  if (over && mySeat >= 0 && !rep.invalid) {
    if (resigned !== null) result = resigned === mySeat ? 'loss' : 'win'
    else if (outcome !== null) result = resultFor(game, mySeat, outcome, m.value, false)
  }

  useEffect(() => {
    if (!result || recorded.current || m.ratings[1 - mySeat] === null) return
    recorded.current = true
    recordResult(user, { id: `match-${m.id}`, gameId: m.gameId, opponent: m.names[1 - mySeat], oppRating: m.ratings[1 - mySeat], result })
      .then(setDelta)
      .catch((e) => console.error(e))
  })

  if (!firebaseConfigured) return <p className="muted">Friend matches need online play, which is not configured on this deployment.</p>
  if (m === undefined) return <p className="muted">Loading match…</p>
  if (m === null || !game) return <p className="muted">This match does not exist, or you cannot see it.</p>

  const link = window.location.href
  const copy = () => navigator.clipboard.writeText(link).then(() => setCopied(true))
  const act = (f) => async (...a) => {
    setBusy(true)
    try {
      await f(...a)
    } catch (e) {
      alert(e.message)
    }
    setBusy(false)
  }
  const join = act(() => joinMatch(user, profile, m, game.turn(JSON.parse(m.init))))
  const move = act((mv) => {
    const next = game.apply(rep.s, mv)
    return pushMove(m, mv, m.seats[terminalValue(game, next) === null ? game.turn(next) : 0], terminalValue(game, next) !== null)
  })
  const names = m.names.map((n, i) => n || (m.seats[i] ? 'Player' : 'waiting…'))

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

      {m.status === 'waiting' && (
        <div className="invite">
          {mySeat >= 0 ? (
            <>
              <p>Send this link to a friend. The game starts when they join.</p>
              <div className="linkbox">
                <input readOnly value={link} onFocus={(e) => e.target.select()} />
                <button onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
              </div>
            </>
          ) : user ? (
            <button onClick={join} disabled={busy}>
              Join as {game.roles[m.seats[0] ? 1 : 0]} (vs {m.names.find(Boolean)}, {m.ratings.find((x) => x !== null)})
            </button>
          ) : (
            <button onClick={() => go('/signin')}>Sign in to join</button>
          )}
        </div>
      )}

      <Table game={game} state={rep.s} names={names.map((n, i) => `${n}${m.ratings[i] !== null ? ` (${m.ratings[i]})` : ''}`)} mySeat={mySeat} turn={turn}>
        {game.kind === 'score' && (
          <p className="goal">
            With perfect play, {game.scoreLabel || 'the score'} ends at {fmtValue(game, m.value, rep.s)}. Beat that to win; match it to draw.
          </p>
        )}
        {rep.invalid && <p className="error">This match contains an illegal move, so it does not count.</p>}
        {over ? (
          result ? (
            <Result result={result} delta={delta}>
              {resigned !== null && <span className="muted">{names[resigned]} resigned.</span>}
            </Result>
          ) : (
            <p className="muted">
              Game over.{' '}
              {resigned !== null
                ? `${names[resigned]} resigned.`
                : game.kind === 'win'
                  ? outcome === 0
                    ? 'Draw.'
                    : `${names[outcome > 0 ? 0 : 1]} wins.`
                  : `${game.scoreLabel || "Score"}: ${fmtValue(game, outcome, rep.s)}.`}
            </p>
          )
        ) : m.status === 'playing' && turn === mySeat ? (
          <>
            <Moves game={game} state={rep.s} onMove={move} disabled={busy} />
            <button className="danger small" onClick={act(() => resignMatch(m, mySeat))} disabled={busy}>
              Resign
            </button>
          </>
        ) : (
          m.status === 'playing' && <p className="muted thinking">Waiting for {names[turn]}…</p>
        )}
        <History game={game} history={rep.history} names={names} />
      </Table>
    </div>
  )
}
