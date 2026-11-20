import { VIEWS } from './views.js'

function autoRows(s) {
  return Object.entries(s)
    .filter(([k]) => k !== 't')
    .map(([k, x]) => (Array.isArray(x) || typeof x === 'string' ? { label: k, tiles: [...x].map(String) } : { label: k, value: JSON.stringify(x) }))
}

function Tiles({ row }) {
  const hl = new Set(row.hl || [])
  const dim = new Set(row.dim || [])
  return (
    <div className="tiles">
      {row.tiles.map((x, i) => (
        <span key={i} className={`tile${hl.has(i) ? ' hl' : ''}${dim.has(i) ? ' dim' : ''}${row.split === i ? ' split' : ''}`}>
          {Array.isArray(x) ? x.join(',') : String(x)}
          <sub>{i + 1}</sub>
        </span>
      ))}
    </div>
  )
}

function Grid({ grid }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${grid[0].length}, 2.4rem)` }}>
      {grid.flatMap((r, i) =>
        r.map((c, j) => (
          <span key={`${i}-${j}`} className="cell" title={`row ${i + 1}, col ${j + 1}`}>
            {c}
          </span>
        )),
      )}
    </div>
  )
}

function layout(n, edges, kind) {
  const pos = []
  if (kind === 'tree') {
    const adj = Array.from({ length: n }, () => [])
    for (const [a, b] of edges) {
      adj[a].push(b)
      adj[b].push(a)
    }
    const depth = Array(n).fill(-1)
    const levels = []
    for (let root = 0; root < n; root++) {
      if (depth[root] >= 0) continue
      depth[root] = 0
      const q = [root]
      while (q.length) {
        const u = q.shift()
        ;(levels[depth[u]] ||= []).push(u)
        for (const w of adj[u]) {
          if (depth[w] >= 0) continue
          depth[w] = depth[u] + 1
          q.push(w)
        }
      }
    }
    levels.forEach((lv, d) => lv.forEach((u, i) => (pos[u] = [((i + 1) * 320) / (lv.length + 1), 30 + d * 55])))
    return { pos, h: 60 + (levels.length - 1) * 55 }
  }
  for (let i = 0; i < n; i++) pos[i] = [160 + 120 * Math.sin((2 * Math.PI * i) / n), 140 - 120 * Math.cos((2 * Math.PI * i) / n)]
  return { pos, h: 280 }
}

function Graph({ graph }) {
  const { n, edges, hl = [], hl2 = [], dim = [], directed } = graph
  const { pos, h } = layout(n, edges, graph.layout)
  return (
    <svg className="graph" viewBox={`0 0 320 ${h}`} width="100%" style={{ maxWidth: 420 }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
        </marker>
      </defs>
      {edges.map(([a, b, lab], i) => (
        <g key={i}>
          <line x1={pos[a][0]} y1={pos[a][1]} x2={pos[b][0]} y2={pos[b][1]} className="edge" markerEnd={directed ? 'url(#arrow)' : undefined} />
          {lab && (
            <text x={(pos[a][0] + pos[b][0]) / 2} y={(pos[a][1] + pos[b][1]) / 2 - 4} className="elabel">
              {lab}
            </text>
          )}
        </g>
      ))}
      {pos.map(([x, y], i) => (
        <g key={i} className={`node${hl.includes(i) ? ' hl' : ''}${hl2.includes(i) ? ' hl2' : ''}${dim.includes(i) ? ' dim' : ''}`}>
          <circle cx={x} cy={y} r="14" />
          <text x={x} y={y + 5}>
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function Board({ game, state }) {
  const view = VIEWS[game.board]
  const rows = view ? view(state, game) : autoRows(state)
  return (
    <div className="board">
      {rows.map((r, i) => (
        <div key={i} className="brow">
          {r.label && <div className="blabel">{r.label}</div>}
          {r.tiles && <Tiles row={r} />}
          {r.value !== undefined && <div className="bvalue">{r.value}</div>}
          {r.grid && <Grid grid={r.grid} />}
          {r.graph && <Graph graph={r.graph} />}
        </div>
      ))}
    </div>
  )
}
