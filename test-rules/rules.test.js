import { after, before, beforeEach, test } from 'node:test'
import { readFileSync } from 'node:fs'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, runTransaction, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'

let env
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'gameforces-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})
after(() => env.cleanup())
beforeEach(() => env.clearFirestore())

const db = (uid) => env.authenticatedContext(uid).firestore()

function rate(d, uid, id, before, delta, games = 0, wins = 0) {
  const b = writeBatch(d)
  b.set(doc(d, 'users', uid, 'history', id), { result: delta > 0 ? 'win' : 'loss', delta, before, gameId: 'x', opponent: 'bot', oppRating: 1500, at: serverTimestamp() })
  b.set(doc(d, 'users', uid), { name: 'A', rating: before + delta, games: games + 1, wins: wins + (delta > 0 ? 1 : 0), lastMatch: id, updatedAt: serverTimestamp() })
  return b.commit()
}

test('first rated game creates a profile', async () => {
  await assertSucceeds(rate(db('a'), 'a', 'bot-1', 1200, 30))
  await assertSucceeds(getDoc(doc(db('b'), 'users', 'a')))
})

test('rating changes over 64 are rejected', async () => {
  await assertFails(rate(db('a'), 'a', 'bot-1', 1200, 65))
})

test('the same match cannot be rated twice', async () => {
  await assertSucceeds(rate(db('a'), 'a', 'bot-1', 1200, 30))
  await assertFails(rate(db('a'), 'a', 'bot-1', 1230, 30, 1, 1))
  await assertSucceeds(rate(db('a'), 'a', 'bot-2', 1230, 30, 1, 1))
})

test('rating needs a matching history entry', async () => {
  const d = db('a')
  await assertFails(setDoc(doc(d, 'users', 'a'), { name: 'A', rating: 1250, games: 1, wins: 1, lastMatch: 'x', updatedAt: serverTimestamp() }))
})

test('cannot write another user', async () => {
  await assertFails(rate(db('b'), 'a', 'bot-1', 1200, 30))
})

test('transaction path used by the app works', async () => {
  const d = db('a')
  await assertSucceeds(
    runTransaction(d, async (tx) => {
      await tx.get(doc(d, 'users', 'a'))
      tx.set(doc(d, 'users', 'a', 'history', 'm1'), { result: 'win', delta: 20, before: 1200, gameId: 'x', opponent: 'bot', oppRating: 1500, at: serverTimestamp() })
      tx.set(doc(d, 'users', 'a'), { name: 'A', rating: 1220, games: 1, wins: 1, lastMatch: 'm1', updatedAt: serverTimestamp() })
    }),
  )
})

const newMatch = (uid) => ({
  gameId: '01-game', tier: 1, seed: 1, value: 1, init: '{}', moves: [], seats: [uid, null], names: ['A', ''], ratings: [1200, null],
  turnUid: null, status: 'waiting', createdBy: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
})

async function playingMatch() {
  await assertSucceeds(setDoc(doc(db('a'), 'matches', 'm'), newMatch('a')))
  await assertSucceeds(updateDoc(doc(db('b'), 'matches', 'm'), { seats: ['a', 'b'], names: ['A', 'B'], ratings: [1200, 1300], status: 'playing', turnUid: 'a' }))
}

test('match create, join and alternate moves', async () => {
  await playingMatch()
  await assertFails(updateDoc(doc(db('b'), 'matches', 'm'), { moves: ['1'], turnUid: 'a' }))
  await assertSucceeds(updateDoc(doc(db('a'), 'matches', 'm'), { moves: ['1'], turnUid: 'b' }))
  await assertFails(updateDoc(doc(db('a'), 'matches', 'm'), { moves: ['1', '2'], turnUid: 'b' }))
  await assertFails(updateDoc(doc(db('b'), 'matches', 'm'), { moves: ['9', '2'], turnUid: 'a' }))
  await assertSucceeds(updateDoc(doc(db('b'), 'matches', 'm'), { moves: ['1', '2'], status: 'done', turnUid: null }))
})

test('a third user cannot join a full match or move', async () => {
  await playingMatch()
  await assertFails(updateDoc(doc(db('c'), 'matches', 'm'), { seats: ['a', 'c'], status: 'playing', turnUid: 'a' }))
  await assertFails(updateDoc(doc(db('c'), 'matches', 'm'), { moves: ['1'], turnUid: 'b' }))
})

test('only the resigning player can resign for their seat', async () => {
  await playingMatch()
  await assertFails(updateDoc(doc(db('a'), 'matches', 'm'), { status: 'done', turnUid: null, resigned: 1 }))
  await assertSucceeds(updateDoc(doc(db('a'), 'matches', 'm'), { status: 'done', turnUid: null, resigned: 0 }))
})

test('creator cannot fake a joined opponent', async () => {
  await assertFails(setDoc(doc(db('a'), 'matches', 'm'), { ...newMatch('a'), seats: ['a', 'b'], status: 'playing' }))
})
