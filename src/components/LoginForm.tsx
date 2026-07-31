'use client'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm({ next }: { next?: string }) {
  const router = useRouter(),
    [register, setRegister] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('')
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const data = Object.fromEntries(new FormData(e.currentTarget))
    const res = await fetch(`/api/auth/${register ? 'register' : 'login'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) return setError(json.error)
    router.push(next && json.redirect === '/' ? next : json.redirect)
    router.refresh()
  }
  return (
    <div className="auth-form">
      <div className="eyebrow" style={{ marginTop: 35 }}>
        {register ? 'Create an account' : 'Welcome back'}
      </div>
      <h2>{register ? 'Join Matchday Marketplace' : 'Sign in'}</h2>
      <p className="muted" style={{ marginBottom: 28 }}>
        {register
          ? 'Create your vendor account and start selling.'
          : 'Use your account to continue.'}
      </p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit}>
        {register && (
          <>
            <div className="field">
              <label>Full name</label>
              <input className="input" name="name" required />
            </div>
            <div className="field">
              <label>Account type</label>
              <select className="input" name="accountType" defaultValue="VENDOR">
                <option value="VENDOR">Vendor — I want to sell</option>
              </select>
            </div>
          </>
        )}
        <div className="field">
          <label>Email address</label>
          <input className="input" type="email" name="email" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" type="password" name="password" minLength={8} required />
        </div>
        <button
          className="button primary"
          style={{ width: '100%', marginTop: 5 }}
          disabled={loading}
        >
          {loading ? 'Please wait…' : register ? 'Create account' : 'Sign in →'}
        </button>
      </form>
      <p className="muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 22 }}>
        {register ? 'Already registered?' : 'New to Matchday Marketplace?'}{' '}
        <button
          onClick={() => {
            setRegister(!register)
            setError('')
          }}
          style={{
            border: 0,
            background: 'none',
            color: 'var(--brand-red)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {register ? 'Sign in' : 'Create an account'}
        </button>
      </p>
      {/* <div
        style={{ borderTop: '1px solid var(--line)', marginTop: 25, paddingTop: 18, fontSize: 12 }}
      >
        <b>Demo accounts</b>
        <div className="muted" style={{ lineHeight: 1.8 }}>
          customer@northstar.local · vendor@northstar.local · admin@northstar.local
          <br />
          Password: Password123!
        </div>
      </div> */}
    </div>
  )
}
