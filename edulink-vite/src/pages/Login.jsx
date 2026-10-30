import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { fullName } from '../lib/helpers.js'
import { useApp } from '../context/appContext.js'

// Prijava v predstavitveno različico (brez gesla): izbira vloge.
export default function Login() {
  const { role: current, store, login } = useApp()
  const navigate = useNavigate()
  const [role, setRole] = useState('ucenec')

  useEffect(() => { document.title = 'Vstop · EduLink' }, [])

  if (current) return <Navigate to="/predmeti" replace />

  const onSubmit = e => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    login(role, role === 'ucitelj' ? data.get('teacher') : null)
    navigate('/predmeti')
  }

  return (
    <div className="auth-shell">
      <main className="auth-form-area">
        <Link to="/prijava"><img className="auth-logo" src="/slike/edulink-logo.png" alt="EduLink" /></Link>
        <form className="auth-form" onSubmit={onSubmit}>
          <h1>Prijava</h1>
          <p>Vnesite uporabniško ime za vstop v učilnico.</p>
          <label className="field">
            Vloga
            <select name="role" value={role} onChange={e => setRole(e.target.value)}>
              <option value="ucenec">Učenec</option>
              <option value="ucitelj">Učitelj</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
          {role === 'ucitelj' && (
            <label className="field">
              Učitelj
              <select name="teacher">
                {store.teachers.map(t => <option key={t.id} value={t.id}>{fullName(t)}</option>)}
              </select>
            </label>
          )}
          {role === 'ucenec' && (
            <label className="field">
              Uporabniško ime
              <input name="username" placeholder="npr. ucenec" autoComplete="username" />
            </label>
          )}
          <p className="note">Predstavitvena različica brez gesla. Podatki in oddaje ostanejo v tem brskalniku.</p>
          <button className="ui-button primary" type="submit">Vstopi</button>
          <p className="auth-bottom">Prvič tukaj? <Link to="/registracija">Ustvari profil</Link></p>
        </form>
      </main>
      <div className="auth-visual" aria-hidden="true"></div>
    </div>
  )
}
