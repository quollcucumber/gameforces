import { rankOf } from '../lib/rank.js'

export default function Handle({ name, rating, uid }) {
  const cls = `handle ${rating === null || rating === undefined ? '' : rankOf(rating).cls}`
  return uid ? (
    <a href={`#/user/${uid}`} className={cls}>
      {name}
    </a>
  ) : (
    <span className={cls}>{name}</span>
  )
}
