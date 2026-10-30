import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import ProfileFields from '../components/ProfileFields.jsx'
import { useApp } from '../context/appContext.js'

// Ustvarjanje učenčevega profila v predstavitveni različici.
export default function Register() {
  const { role, profile, saveProfile, login } = useApp()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => { document.title = 'Registracija · EduLink' }, [])

  if (role) return <Navigate to="/predmeti" replace />

  const onSubmit = e => {
    e.preventDefault()
    const values = Object.fromEntries(new FormData(e.currentTarget))
    if (!values.first?.trim() || !values.last?.trim()) { setError('Vnesite ime in priimek.'); return }
    try {
      saveProfile(values)
    } catch {
      setError('Shranjevanje ni na voljo. Omogočite lokalno shrambo brskalnika.')
      return
    }
    login('ucenec')
    navigate('/predmeti')
  }

  return (
    <div className="auth-shell">
      <main className="auth-form-area">
        <Link to="/prijava"><img className="auth-logo" src="/slike/edulink-logo.png" alt="EduLink" /></Link>
        <form className="auth-form" onSubmit={onSubmit}>
          <h1>Ustvari profil</h1>
          <p>Vnesite svoje podatke za predstavitveno učilnico.</p>
          <ProfileFields values={profile} />
          <p className="note">Predstavitvena različica brez gesla. Podatki in oddaje ostanejo v tem brskalniku.</p>
          <p className="form-error" role="alert">{error}</p>
          <button className="ui-button primary" type="submit">Ustvari profil in vstopi</button>
          <p className="auth-bottom">Že imate profil? <Link to="/prijava">Prijava</Link></p>
        </form>
      </main>
      <div className="auth-visual" aria-hidden="true"></div>
    </div>
  )
}
