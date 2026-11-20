import Board from './Board.jsx'
import Handle from './Handle.jsx'

export const fmtValue = (game, v, s) => (game.formatValue ? game.formatValue(v, s) : String(v))

export function Moves({ game, state, onMove, disabled }) {
  const moves = game.moves(state)
  return (
    <div className={`moves${moves.length > 12 ? ' many' : ''}`}>
      {moves.map((m, i) => (
        <button key={i} disabled={disabled} onClick={() => onMove(m)}>
          {game.label(state, m)}
        </button>
      ))}
    </div>
  )
}

export function History({ history, names, review }) {
  if (!history.length) return null
  return (
    <ol className="history">
      {history.map((h, i) => (
        <li key={i} className={review && h.optimal === false ? 'bad' : ''}>
          <b>{names[h.seat]}</b>: {h.label}
          {review && h.optimal === false && <span className="tag">mistake</span>}
        </li>
      ))}
    </ol>
  )
}

export function Table({ game, state, names, mySeat, turn, ratings, uids, children }) {
  return (
    <div className="table">
      <div className="players">
        {[0, 1].map((i) => (
          <div key={i} className={`player${turn === i ? ' active' : ''}`}>
            <span className="role">{game.roles[i]}</span>
            <span>
              {ratings && ratings[i] !== null ? (
                <>
                  <Handle name={names[i]} rating={ratings[i]} uid={uids && uids[i]} /> <span className="muted">({ratings[i]})</span>
                </>
              ) : (
                names[i]
              )}
              {mySeat === i ? ' (you)' : ''}
            </span>
          </div>
        ))}
      </div>
      <Board game={game} state={state} />
      {children}
    </div>
  )
}

export function Result({ result, delta, children }) {
  const text = { win: 'You win!', loss: 'You lose.', draw: 'Draw.' }[result]
  return (
    <div className={`result ${result}`}>
      <span>{text}</span>
      {delta !== null && delta !== undefined && (
        <span className="delta">
          {delta >= 0 ? '+' : ''}
          {delta}
        </span>
      )}
      {children}
    </div>
  )
}
