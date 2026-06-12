'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'

type Mode = 'login' | 'signup' | 'forgot' | 'reset'

export default function AuthForm({ mode }: { mode: Mode }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    if ((mode === 'signup' || mode === 'reset') && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setPending(true)
    try {
      const accountURL = `${window.location.origin}/account/`
      if (mode === 'login') {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: accountURL,
        })
        if (result.error) throw new Error(result.error.message)
        window.location.assign('/account/')
      } else if (mode === 'signup') {
        const result = await authClient.signUp.email({
          name,
          email,
          password,
          callbackURL: accountURL,
        })
        if (result.error) throw new Error(result.error.message)
        window.location.assign('/account/')
      } else if (mode === 'forgot') {
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/reset-password/`,
        })
        if (result.error) throw new Error(result.error.message)
        setMessage('Check your email for a password reset link.')
      } else {
        const token = new URLSearchParams(window.location.search).get('token')
        if (!token) throw new Error('This password reset link is missing its token.')
        const result = await authClient.resetPassword({ newPassword: password, token })
        if (result.error) throw new Error(result.error.message)
        setMessage('Password updated. You can now sign in.')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication failed. Please try again.')
    } finally {
      setPending(false)
    }
  }

  const title = {
    login: 'Sign In',
    signup: 'Create Account',
    forgot: 'Reset Password',
    reset: 'Choose New Password',
  }[mode]

  return (
    <section className="ngc-auth-card" aria-labelledby="auth-title">
      <h1 id="auth-title" className="ngc-auth-card__title">{title}</h1>
      <form onSubmit={submit} className="ngc-auth-form">
        {mode === 'signup' && (
          <label className="ngc-field">
            <span className="ngc-field__label">Name</span>
            <input className="ngc-input" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
          </label>
        )}

        {mode !== 'reset' && (
          <label className="ngc-field">
            <span className="ngc-field__label">Email</span>
            <input className="ngc-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </label>
        )}

        {mode !== 'forgot' && (
          <label className="ngc-field">
            <span className="ngc-field__label">Password</span>
            <input
              className="ngc-input"
              type="password"
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
        )}

        {(mode === 'signup' || mode === 'reset') && (
          <label className="ngc-field">
            <span className="ngc-field__label">Confirm password</span>
            <input className="ngc-input" type="password" minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
          </label>
        )}

        {error && <div className="ngc-alert" role="alert">{error}</div>}
        {message && <div className="ngc-auth-success" role="status">{message}</div>}

        <button type="submit" className="ngc-btn ngc-btn--dark ngc-btn--block" disabled={pending}>
          {pending ? 'Please wait...' : title}
        </button>
      </form>

      {mode === 'login' && (
        <>
          <button
            type="button"
            className="ngc-auth-google"
            onClick={() => authClient.signIn.social({
              provider: 'google',
              callbackURL: `${window.location.origin}/account/`,
            })}
          >
            Continue with Google
          </button>
          <div className="ngc-auth-links">
            <Link href="/forgot-password/">Forgot password?</Link>
            <Link href="/signup/">Create account</Link>
          </div>
        </>
      )}
      {mode === 'signup' && <p className="ngc-auth-switch">Already registered? <Link href="/login/">Sign in</Link></p>}
      {(mode === 'forgot' || mode === 'reset') && <p className="ngc-auth-switch"><Link href="/login/">Back to sign in</Link></p>}
    </section>
  )
}
