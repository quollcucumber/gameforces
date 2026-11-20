import { firebaseConfigured } from '../lib/firebase.js'
import { rankOf } from '../lib/rank.js'
import { useLeaderboard } from '../lib/store.js'
import Handle from './Handle.jsx'

export default function Leaderboard({ user }) {
  const rows = useLeaderboard()
  if (!firebaseConfigured) return <p className="muted">The leaderboard needs online play, which is not configured on this deployment.</p>
  return (
    <div className="narrow">
      <h1>Leaderboard</h1>
      {!rows ? (
        <p className="muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="muted">No rated players yet.</p>
      ) : (
        <table className="lb">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Rank</th>
              <th>Rating</th>
              <th>Games</th>
              <th>Wins</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.uid} className={user && user.uid === r.uid ? 'mine' : ''}>
                <td>{i + 1}</td>
                <td>
                  <Handle name={r.name} rating={r.rating} uid={r.uid} />
                </td>
                <td className={rankOf(r.rating).cls}>{rankOf(r.rating).title}</td>
                <td>
                  <b className={rankOf(r.rating).cls}>{r.rating}</b>
                </td>
                <td>{r.games}</td>
                <td>{r.wins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
