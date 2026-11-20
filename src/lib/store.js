import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import {
  addDoc, collection, doc, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { START_RATING, ratingDelta, scoreOf } from '../engine/elo.js'
import { auth, db, firebaseConfigured, googleProvider } from './firebase.js'

const LOCAL_KEY = 'gameforces.guest'

export function useAuth() {
  const [user, setUser] = useState(undefined)
  useEffect(() => {
    if (!firebaseConfigured) {
      setUser(null)
      return
    }
    return onAuthStateChanged(auth, (u) => setUser(u))
  }, [])
  return user
}

export const signIn = () => signInWithPopup(auth, googleProvider)
export const signOutUser = () => signOut(auth)

const emptyProfile = (name) => ({ name, rating: START_RATING, games: 0, wins: 0 })

function readGuest() {
  try {
    return { ...emptyProfile('Guest'), ...JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') }
  } catch {
    return emptyProfile('Guest')
  }
}

export function useProfile(user) {
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    if (user === undefined) return
    if (!user) {
      setProfile(readGuest())
      const h = () => setProfile(readGuest())
      window.addEventListener('gameforces-guest', h)
      return () => window.removeEventListener('gameforces-guest', h)
    }
    return onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setProfile(snap.exists() ? snap.data() : emptyProfile(user.displayName || 'Player'))
    })
  }, [user])
  return profile
}

// Records a finished game and returns the rating change. `id` makes the update idempotent per match.
export async function recordResult(user, { id, gameId, opponent, oppRating, result }) {
  if (!user) {
    const p = readGuest()
    const delta = ratingDelta(p.rating, oppRating, scoreOf(result), p.games)
    const next = { ...p, rating: p.rating + delta, games: p.games + 1, wins: p.wins + (result === 'win' ? 1 : 0) }
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event('gameforces-guest'))
    return delta
  }
  const userRef = doc(db, 'users', user.uid)
  const histRef = doc(db, 'users', user.uid, 'history', id)
  return runTransaction(db, async (tx) => {
    const [u, h] = [await tx.get(userRef), await tx.get(histRef)]
    if (h.exists()) return h.data().delta
    const p = u.exists() ? u.data() : emptyProfile(user.displayName || 'Player')
    const delta = ratingDelta(p.rating, oppRating, scoreOf(result), p.games)
    tx.set(histRef, { gameId, opponent, oppRating, result, delta, before: p.rating, at: serverTimestamp() })
    tx.set(userRef, {
      name: p.name || user.displayName || 'Player',
      rating: p.rating + delta,
      games: p.games + 1,
      wins: p.wins + (result === 'win' ? 1 : 0),
      lastMatch: id,
      updatedAt: serverTimestamp(),
    })
    return delta
  })
}

export function useLeaderboard() {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    if (!firebaseConfigured) return
    return onSnapshot(query(collection(db, 'users'), orderBy('rating', 'desc'), limit(50)), (snap) =>
      setRows(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))),
    )
  }, [])
  return rows
}

// ---- Friend matches ----

export async function createMatch(user, profile, { gameId, tier, seed, seat, init, value }) {
  const seats = [null, null]
  const names = ['', '']
  const ratings = [null, null]
  seats[seat] = user.uid
  names[seat] = profile.name || user.displayName || 'Player'
  ratings[seat] = profile.rating
  const ref = await addDoc(collection(db, 'matches'), {
    gameId, tier, seed, value, init: JSON.stringify(init), moves: [], seats, names, ratings,
    turnUid: null, status: 'waiting', createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  return ref.id
}

export function useMatch(id) {
  const [m, setM] = useState(undefined)
  useEffect(() => {
    if (!firebaseConfigured || !id) return
    return onSnapshot(
      doc(db, 'matches', id),
      (snap) => setM(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      () => setM(null),
    )
  }, [id])
  return m
}

export async function joinMatch(user, profile, match, firstTurnSeat) {
  const seat = match.seats[0] ? 1 : 0
  const seats = match.seats.slice()
  const names = match.names.slice()
  const ratings = match.ratings.slice()
  seats[seat] = user.uid
  names[seat] = profile.name || user.displayName || 'Player'
  ratings[seat] = profile.rating
  await updateDoc(doc(db, 'matches', match.id), {
    seats, names, ratings, status: 'playing', turnUid: seats[firstTurnSeat], updatedAt: serverTimestamp(),
  })
}

export async function pushMove(match, move, nextTurnUid, done) {
  await updateDoc(doc(db, 'matches', match.id), {
    moves: [...match.moves, JSON.stringify(move)],
    turnUid: done ? null : nextTurnUid,
    status: done ? 'done' : 'playing',
    updatedAt: serverTimestamp(),
  })
}

export async function resignMatch(match, seat) {
  await updateDoc(doc(db, 'matches', match.id), { status: 'done', turnUid: null, resigned: seat, updatedAt: serverTimestamp() })
}

// Consecutive wins against the bot per game, kept in this browser. Friend matches do not count.
export const MASTERY_STREAK = 10
const streakKey = (user) => `gameforces.streaks.${user ? user.uid : 'guest'}`

function readStreaks(user) {
  try {
    return JSON.parse(localStorage.getItem(streakKey(user)) || '{}')
  } catch {
    return {}
  }
}

export function recordBotStreak(user, gameId, result) {
  const all = readStreaks(user)
  const cur = all[gameId] || { streak: 0, mastered: false }
  const streak = result === 'win' ? cur.streak + 1 : 0
  const next = { streak, mastered: cur.mastered || streak >= MASTERY_STREAK, justMastered: !cur.mastered && streak >= MASTERY_STREAK }
  all[gameId] = { streak: next.streak, mastered: next.mastered }
  localStorage.setItem(streakKey(user), JSON.stringify(all))
  window.dispatchEvent(new Event('gameforces-streaks'))
  return next
}

export function useStreaks(user) {
  const [all, setAll] = useState({})
  useEffect(() => {
    if (user === undefined) return
    const h = () => setAll(readStreaks(user))
    h()
    window.addEventListener('gameforces-streaks', h)
    return () => window.removeEventListener('gameforces-streaks', h)
  }, [user])
  return all
}
