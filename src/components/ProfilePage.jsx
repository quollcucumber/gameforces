import { GAME_BY_ID } from '../games/index.js'
import { rankOf } from '../lib/rank.js'
import { useHistory, useUserDoc } from '../lib/store.js'
import Handle from './Handle.jsx'
import RatingChart from './RatingChart.jsx'

export default function ProfilePage({ uid, profile }) {
  const isGuest = uid === 'guest'
  const doc = useUserDoc(isGuest ? null : uid)
  const p = isGuest ? profile : doc
  const history = useHistory(isGuest ? null : uid)
  if (p === undefined || history === undefined) return <p className="muted">Loading…</p>
  if (!p) return <p className="muted">No rated games for this player yet.</p>
  const rank = rankOf(p.rating)
  const best = Math.max(p.rating, ...history.map((h) => h.before + h.delta))
  return (
    <div className="narrow profile">
      <h1>
        <Handle name={p.name} rating={p.rating} />
      </h1>
      <p>
        <span className={`handle ${rank.cls}`}>{rank.title}</span> · rating <b className={rank.cls}>{p.rating}</b> · max{' '}
        <b className={rankOf(best).cls}>{best}</b> · {p.games} games, {p.wins} wins
        {isGuest && <span className="muted"> · saved in this browser</span>}
      </p>
      {history.length ? <RatingChart history={history} /> : <p className="muted">Play a rated game to start the graph.</p>}
      {history.length > 0 && (
        <table className="lb">
          <thead>
            <tr>
              <th>#</th>
              <th>Game</th>
              <th>Opponent</th>
              <th>Result</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {history
              .map((h, i) => [h, i])
              .reverse()
              .slice(0, 30)
              .map(([h, i]) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{GAME_BY_ID[h.gameId] ? <a href={`#/game/${h.gameId}`}>{GAME_BY_ID[h.gameId].title}</a> : h.gameId}</td>
                  <td>{h.opponent === 'bot' ? `bot (${h.oppRating})` : <Handle name={h.opponent} rating={h.oppRating} />}</td>
                  <td>{h.result}</td>
                  <td>
                    <b className={rankOf(h.before + h.delta).cls}>{h.before + h.delta}</b>{' '}
                    <span className={h.delta >= 0 ? 'up' : 'down'}>
                      ({h.delta >= 0 ? '+' : ''}
                      {h.delta})
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
