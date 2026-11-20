import {
  createUserWithEmailAndPassword, onIdTokenChanged, sendEmailVerification, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile,
} from 'firebase/auth'
import {
  addDoc, collection, doc, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { START_RATING, ratingDelta, scoreOf } from '../engine/elo.js'
import { auth, db, firebaseConfigured, googleProvider } from './firebase.js'

const LOCAL_KEY = 'gameforces.guest'
const LOCAL_HISTORY = 'gameforces.guestHistory'

// The signed-in account, verified or not. `undefined` while loading.
export function useAuth() {
  const [state, setState] = useState({ user: undefined })
  useEffect(() => {
    if (!firebaseConfigured) {
      setState({ user: null })
      return
    }
    // A fresh object each time, so refreshing emailVerified re-renders.
    return onIdTokenChanged(auth, (u) => setState({ user: u }))
  }, [])
  return state.user
}

const verifyLink = () => ({ url: `${location.origin}${location.pathname}#/signin` })

export const signIn = () => signInWithPopup(auth, googleProvider)
export const signOutUser = () => signOut(auth)
export const signInEmail = (email, password) => signInWithEmailAndPassword(auth, email, password)
export async function signUpEmail(email, password, name) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(user, { displayName: name })
  await sendEmailVerification(user, verifyLink())
}
export const resendVerification = () => sendEmailVerification(auth.currentUser, verifyLink())
export const resetPassword = (email) => sendPasswordResetEmail(auth, email)
// Reloads the account and forces a new ID token so Firestore sees email_verified.
export async function refreshVerification() {
  await auth.currentUser.reload()
  await auth.currentUser.getIdToken(true)
  return auth.currentUser.emailVerified
}

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
// noGain: the player has mastered this game against the bot, so a win no longer adds rating.
export async function recordResult(user, { id, gameId, opponent, oppRating, result, noGain = false }) {
  if (!user) {
    const p = readGuest()
    const delta = Math.min(noGain ? 0 : Infinity, ratingDelta(p.rating, oppRating, scoreOf(result), p.games, opponent === 'bot'))
    const next = { ...p, rating: p.rating + delta, games: p.games + 1, wins: p.wins + (result === 'win' ? 1 : 0) }
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
    localStorage.setItem(LOCAL_HISTORY, JSON.stringify([...readGuestHistory(), { gameId, opponent, oppRating, result, delta, before: p.rating, at: Date.now() }]))
    window.dispatchEvent(new Event('gameforces-guest'))
    return delta
  }
  const userRef = doc(db, 'users', user.uid)
  const histRef = doc(db, 'users', user.uid, 'history', id)
  return runTransaction(db, async (tx) => {
    const [u, h] = [await tx.get(userRef), await tx.get(histRef)]
    if (h.exists()) return h.data().delta
    const p = u.exists() ? u.data() : emptyProfile(user.displayName || 'Player')
    const delta = Math.min(noGain ? 0 : Infinity, ratingDelta(p.rating, oppRating, scoreOf(result), p.games, opponent === 'bot'))
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

function readGuestHistory() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_HISTORY) || '[]')
  } catch {
    return []
  }
}

// Rated games in order. `uid === null` means the guest in this browser.
export function useHistory(uid) {
  const [rows, setRows] = useState(undefined)
  useEffect(() => {
    if (uid === null || !firebaseConfigured) {
      const h = () => setRows(readGuestHistory())
      h()
      window.addEventListener('gameforces-guest', h)
      return () => window.removeEventListener('gameforces-guest', h)
    }
    return onSnapshot(
      query(collection(db, 'users', uid, 'history'), orderBy('at')),
      (snap) => setRows(snap.docs.map((d) => d.data())),
      () => setRows([]),
    )
  }, [uid])
  return rows
}

export function useUserDoc(uid) {
  const [p, setP] = useState(undefined)
  useEffect(() => {
    if (!uid || !firebaseConfigured) return
    return onSnapshot(doc(db, 'users', uid), (snap) => setP(snap.exists() ? snap.data() : null), () => setP(null))
  }, [uid])
  return p
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

export function recordBotStreak(user, streakId, result) {
  const all = readStreaks(user)
  const cur = all[streakId] || { streak: 0, mastered: false }
  const streak = result === 'win' ? cur.streak + 1 : 0
  const next = { streak, mastered: cur.mastered || streak >= MASTERY_STREAK, justMastered: !cur.mastered && streak >= MASTERY_STREAK }
  all[streakId] = { streak: next.streak, mastered: next.mastered }
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
