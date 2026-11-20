import GamePage from './components/GamePage.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import Lobby from './components/Lobby.jsx'
import MatchPage from './components/MatchPage.jsx'
import AuthPage from './components/AuthPage.jsx'
import { GAME_BY_ID } from './games/index.js'
import { firebaseConfigured } from './lib/firebase.js'
import { go, useRoute } from './lib/route.js'
import { signOutUser, useAuth, useProfile } from './lib/store.js'

export default function App() {
  const route = useRoute()
  const account = useAuth()
  // Unverified email accounts play as guests until they click the link.
  const user = account && !account.emailVerified ? null : account
  const profile = useProfile(user)
  const ctx = { user, profile }
  let page
  if (route[0] === 'game' && GAME_BY_ID[route[1]]) page = <GamePage key={route[1]} game={GAME_BY_ID[route[1]]} {...ctx} />
  else if (route[0] === 'match' && route[1]) page = <MatchPage key={route[1]} id={route[1]} {...ctx} />
  else if (route[0] === 'signin') page = <AuthPage account={account} />
  else if (route[0] === 'leaderboard') page = <Leaderboard {...ctx} />
  else page = <Lobby {...ctx} />
  return (
    <>
      <header className="top">
        <a href="#/" className="logo">
          Game<span>forces</span>
        </a>
        <nav>
          <a href="#/">Games</a>
          <a href="#/leaderboard">Leaderboard</a>
        </nav>
        <div className="me">
          {profile && (
            <span className="rating" title={`${profile.games} games, ${profile.wins} wins`}>
              {profile.name} · <b>{profile.rating}</b>
            </span>
          )}
          {firebaseConfigured && account && !user && (
            <a href="#/signin" className="verify-pill">
              Verify your email
            </a>
          )}
          {firebaseConfigured &&
            account !== undefined &&
            (account ? (
              <button className="ghost" onClick={signOutUser}>
                Sign out
              </button>
            ) : (
              <button onClick={() => go('/signin')}>Sign in</button>
            ))}
        </div>
      </header>
      <main>{page}</main>
      <footer>
        Games and ratings are from <a href="https://codeforces.com/problemset?tags=games">Codeforces</a>. Positions are
        small so a perfect solver can play them.
      </footer>
    </>
  )
}
