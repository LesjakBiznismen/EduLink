import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../context/appContext.js'

// Prijava z uporabniškim imenom (ali e-naslovom) in geslom; vlogo določi strežnik.
export default function Login() {
  const { role, login } = useApp()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { document.title = 'Vstop · EduLink' }, [])

  if (role) return <Navigate to="/predmeti" replace />

  const onSubmit = async e => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await login(String(data.get('username')).trim(), String(data.get('password')))
      navigate('/predmeti')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <main className="auth-form-area">
        <Link to="/prijava"><img className="auth-logo" src="/slike/edulink-logo.png" alt="EduLink" /></Link>
        <form className="auth-form" onSubmit={onSubmit}>
          <h1>Prijava</h1>
          <p>Vnesite uporabniško ime in geslo za vstop v učilnico.</p>
          <label className="field">
            Uporabniško ime ali e-naslov
            <input name="username" required autoComplete="username" placeholder="npr. jan.novak1" />
          </label>
          <label className="field">
            Geslo
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <p className="form-error" role="alert">{error}</p>
          <button className="ui-button primary" type="submit" disabled={busy}>{busy ? 'Prijavljanje …' : 'Vstopi'}</button>
          <p className="auth-bottom">Prvič tukaj? <Link to="/registracija">Ustvari profil</Link></p>
        </form>
      </main>
      <div className="auth-visual" aria-hidden="true"></div>
    </div>
  )
}
