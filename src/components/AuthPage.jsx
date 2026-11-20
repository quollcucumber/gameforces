import { useState } from 'react'
import { firebaseConfigured } from '../lib/firebase.js'
import { go } from '../lib/route.js'
import { refreshVerification, resendVerification, resetPassword, signIn, signInEmail, signOutUser, signUpEmail } from '../lib/store.js'

const friendly = (e) =>
  ({
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/email-already-in-use': 'That email already has an account. Sign in instead.',
    'auth/weak-password': 'Use at least 6 characters for the password.',
    'auth/invalid-email': 'That email address does not look right.',
    'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
    'auth/operation-not-allowed': 'Email sign-in is not enabled for this site yet.',
  })[e.code] || e.message

export default function AuthPage({ account }) {
  const [mode, setMode] = useState('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = async (f) => {
    setBusy(true)
    setMsg(null)
    try {
      await f()
    } catch (e) {
      setMsg({ error: true, text: friendly(e) })
    }
    setBusy(false)
  }

  if (!firebaseConfigured) return <p className="muted">Online play is not configured on this deployment.</p>

  if (account && account.emailVerified)
    return (
      <div className="auth">
        <h2>You're signed in</h2>
        <p className="muted">Signed in as {account.email}.</p>
        <button onClick={() => go('/')}>Back to the games</button>
      </div>
    )

  if (account)
    return (
      <div className="auth">
        <h2>Check your email</h2>
        <p>
          We sent a verification link to <b>{account.email}</b>. Click it, then come back here. Until then you play as a
          guest, and your rating stays in this browser.
        </p>
        <div className="row">
          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                if (await refreshVerification()) go('/')
                else setMsg({ text: 'Not verified yet. Check your spam folder too.' })
              })
            }
          >
            I've clicked the link
          </button>
          <button className="ghost" disabled={busy} onClick={() => run(async () => { await resendVerification(); setMsg({ text: 'Sent another link.' }) })}>
            Resend email
          </button>
          <button className="ghost" onClick={signOutUser}>
            Use another account
          </button>
        </div>
        {msg && <p className={msg.error ? 'error' : 'muted'}>{msg.text}</p>}
      </div>
    )

  const submit = (e) => {
    e.preventDefault()
    if (mode === 'in') run(() => signInEmail(email, password))
    else if (mode === 'up') run(() => signUpEmail(email, password, name.trim() || email.split('@')[0]))
    else run(async () => { await resetPassword(email); setMsg({ text: 'If that email has an account, a reset link is on its way.' }) })
  }

  return (
    <div className="auth">
      <h2>Sign in to play friends and join the leaderboard</h2>
      <button disabled={busy} onClick={() => run(async () => { await signIn(); go('/') })}>
        Continue with Google
      </button>
      <p className="or">or use your email</p>
      <div className="tabs">
        {[['in', 'Sign in'], ['up', 'Create account'], ['reset', 'Forgot password']].map(([id, label]) => (
          <button key={id} className={mode === id ? '' : 'ghost'} onClick={() => { setMode(id); setMsg(null) }}>
            {label}
          </button>
        ))}
      </div>
      <form onSubmit={submit}>
        {mode === 'up' && <input placeholder="Display name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />}
        <input type="email" required placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode !== 'reset' && (
          <input type="password" required minLength={6} placeholder="Password" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
        )}
        <button type="submit" disabled={busy}>
          {mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create account and send link' : 'Send reset link'}
        </button>
      </form>
      {msg && <p className={msg.error ? 'error' : 'muted'}>{msg.text}</p>}
    </div>
  )
}
