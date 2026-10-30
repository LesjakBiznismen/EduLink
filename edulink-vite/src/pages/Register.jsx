import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import ProfileFields from '../components/ProfileFields.jsx'
import { useApp } from '../context/appContext.js'

// Registracija novega učenca: podatki profila, uporabniško ime in geslo.
export default function Register() {
  const { role, register } = useApp()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { document.title = 'Registracija · EduLink' }, [])

  if (role) return <Navigate to="/predmeti" replace />

  const onSubmit = async e => {
    e.preventDefault()
    const values = Object.fromEntries(new FormData(e.currentTarget))
    if (!values.first?.trim() || !values.last?.trim()) { setError('Vnesite ime in priimek.'); return }
    if (values.password !== values.repeat) { setError('Gesli se ne ujemata.'); return }
    setBusy(true)
    setError('')
    try {
      await register(values)
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
          <h1>Ustvari profil</h1>
          <p>Vnesite svoje podatke. Profil bo ustvarjen kot učenec.</p>
          <ProfileFields values={{}} emailRequired />
          <div className="profile-fields">
            <label className="field">
              Uporabniško ime
              <input name="username" required minLength={3} maxLength={50} pattern="[A-Za-z0-9._\-]+" autoComplete="username" />
            </label>
            <label className="field">
              Geslo
              <input name="password" type="password" required minLength={8} autoComplete="new-password" />
            </label>
            <label className="field">
              Ponovi geslo
              <input name="repeat" type="password" required minLength={8} autoComplete="new-password" />
            </label>
          </div>
          <p className="form-error" role="alert">{error}</p>
          <button className="ui-button primary" type="submit" disabled={busy}>Ustvari profil in vstopi</button>
          <p className="auth-bottom">Že imate profil? <Link to="/prijava">Prijava</Link></p>
        </form>
      </main>
      <div className="auth-visual" aria-hidden="true"></div>
    </div>
  )
}
