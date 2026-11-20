import { useMemo, useState } from 'react'
import { GAMES } from '../games/index.js'
import { firebaseConfigured } from '../lib/firebase.js'
import { useStreaks } from '../lib/store.js'

const band = (r) => (r < 1200 ? 'gray' : r < 1400 ? 'green' : r < 1600 ? 'cyan' : r < 1900 ? 'blue' : r < 2100 ? 'violet' : r < 2400 ? 'orange' : 'red')

export default function Lobby({ user }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('rating')
  const streaks = useStreaks(user)
  const list = useMemo(() => {
    const f = GAMES.filter((g) => `${g.title} ${g.cf.contest}${g.cf.index} ${g.cf.name}`.toLowerCase().includes(q.toLowerCase()))
    if (sort === 'rating-desc') return f.slice().reverse()
    if (sort === 'name') return f.slice().sort((a, b) => a.title.localeCompare(b.title))
    return f
  }, [q, sort])
  return (
    <div>
      <section className="hero">
        <h1>Play the game theory problems from Codeforces.</h1>
        <p>
          Pick a problem and play it against a perfect bot, or send a link to a friend. You always get the winning side
          against the bot, but one wrong move and the bot will punish it. Harder problems and bigger positions give more
          rating.
        </p>
        {!user && (
          <p className="muted">
            {firebaseConfigured
              ? 'You are playing as a guest, and your rating is saved only in this browser. Sign in to play friends and join the leaderboard.'
              : 'Online play is not configured on this deployment, so your rating is saved only in this browser.'}
          </p>
        )}
      </section>
      <div className="filters">
        <input placeholder="Search games or problem ids…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="rating">Easiest first</option>
          <option value="rating-desc">Hardest first</option>
          <option value="name">Name</option>
        </select>
        <span className="muted">{list.length} games</span>
      </div>
      <div className="cards">
        {list.map((g) => (
          <a key={g.id} className="card" href={`#/game/${g.id}`}>
            <div className="card-top">
              <span className={`cf-rating ${band(g.cf.rating)}`}>{g.cf.rating}</span>
              <span className="muted">
                {streaks[g.id]?.mastered && <span className="mastered">Mastered</span>}
                {g.cf.contest}
                {g.cf.index}
              </span>
            </div>
            <h3>{g.title}</h3>
            <p>{g.rules.length > 140 ? g.rules.slice(0, 137) + '…' : g.rules}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
