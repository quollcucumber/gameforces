import { RANKS } from '../lib/rank.js'
import { START_RATING } from '../engine/elo.js'

const W = 760
const H = 300
const PAD = { l: 44, r: 12, t: 10, b: 24 }

// Rating after each game, with Codeforces rank bands behind the line.
export default function RatingChart({ history }) {
  const pts = [START_RATING, ...history.map((h) => h.before + h.delta)]
  const lo = Math.floor((Math.min(...pts) - 150) / 100) * 100
  const hi = Math.ceil((Math.max(...pts) + 150) / 100) * 100
  const x = (i) => PAD.l + ((W - PAD.l - PAD.r) * i) / Math.max(1, pts.length - 1)
  const y = (r) => PAD.t + ((H - PAD.t - PAD.b) * (hi - r)) / (hi - lo)
  const bands = RANKS.map((rk, i) => [Math.max(lo, rk.min), Math.min(hi, i + 1 < RANKS.length ? RANKS[i + 1].min : hi), rk]).filter(([a, b]) => a < b)
  const ticks = []
  for (let r = lo; r <= hi; r += hi - lo > 1000 ? 200 : 100) ticks.push(r)
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%">
      {bands.map(([a, b, rk]) => (
        <rect key={rk.title} x={PAD.l} width={W - PAD.l - PAD.r} y={y(b)} height={y(a) - y(b)} fill={rk.band} fillOpacity="0.28">
          <title>{rk.title}</title>
        </rect>
      ))}
      {ticks.map((r) => (
        <text key={r} x={PAD.l - 6} y={y(r) + 4} className="tick">
          {r}
        </text>
      ))}
      <polyline points={pts.map((r, i) => `${x(i)},${y(r)}`).join(' ')} className="line" />
      {pts.map((r, i) => (
        <circle key={i} cx={x(i)} cy={y(r)} r={pts.length > 80 ? 1.5 : 3} className="pt">
          <title>{i === 0 ? `Start: ${r}` : `Game ${i}: ${r} (${history[i - 1].delta >= 0 ? '+' : ''}${history[i - 1].delta}, ${history[i - 1].result} vs ${history[i - 1].opponent})`}</title>
        </circle>
      ))}
      <text x={W - PAD.r} y={H - 6} className="tick">
        games played
      </text>
    </svg>
  )
}
