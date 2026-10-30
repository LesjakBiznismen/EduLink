import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import PageHeader from '../components/PageHeader.jsx'
import ProfileFields from '../components/ProfileFields.jsx'
import { api } from '../lib/api.js'
import { useApp } from '../context/appContext.js'

const teacherFields = [
  ['first', 'Ime', 'text', true, 'given-name'],
  ['last', 'Priimek', 'text', true, 'family-name'],
  ['email', 'E-naslov', 'email', true, 'email'],
  ['phone', 'Telefon', 'tel', false, 'tel'],
  ['title', 'Naziv', 'text', false, 'honorific-prefix'],
  ['office', 'Kabinet', 'text', false, 'off'],
  ['school', 'Šola', 'text', false, 'organization'],
]

function Banner({ identity, username }) {
  return (
    <div className="profile-banner">
      <span className="avatar" aria-hidden="true">{identity.initials}</span>
      <div>
        <h2>{identity.name}</h2>
        <span className="badge accent">{identity.label}</span> <span className="note">{username}</span>
      </div>
    </div>
  )
}

const Logout = ({ onClick }) => (
  <Link className="ui-button" to="/prijava" onClick={onClick}><Icon name="logout" /> Odjava</Link>
)

// Sprememba gesla (za vse vloge).
function PasswordForm() {
  const { toast } = useApp()
  const [error, setError] = useState('')

  const onSubmit = async e => {
    e.preventDefault()
    const form = e.currentTarget
    const v = Object.fromEntries(new FormData(form))
    if (v.next !== v.repeat) { setError('Novi gesli se ne ujemata.'); return }
    try {
      await api.put('/profile/password', { current: v.current, next: v.next })
      form.reset()
      setError('')
      toast('Geslo je spremenjeno.')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="profile-panel" onSubmit={onSubmit}>
      <h2>Sprememba gesla</h2>
      <div className="profile-fields">
        <label className="field">Trenutno geslo<input name="current" type="password" required autoComplete="current-password" /></label>
        <label className="field">Novo geslo<input name="next" type="password" required minLength={8} autoComplete="new-password" /></label>
        <label className="field">Ponovi novo geslo<input name="repeat" type="password" required minLength={8} autoComplete="new-password" /></label>
      </div>
      <p className="form-error" role="alert">{error}</p>
      <div className="profile-footer"><span></span><button className="ui-button primary" type="submit">Spremeni geslo</button></div>
    </form>
  )
}

function AdminProfile() {
  const { identity, user, logout } = useApp()
  const [stats, setStats] = useState(null)
  useEffect(() => { api.get('/stats').then(setStats).catch(() => {}) }, [])
  return (
    <div className="profile-panel">
      <Banner identity={identity} username={user.username} />
      {stats && (
        <p className="note">
          {stats.subjects} predmetov · {stats.teachers} učiteljev · {stats.students} učencev · {stats.assignments} nalog · {stats.submissions} oddaj · {stats.materials} gradiv
        </p>
      )}
      <div className="profile-footer"><Logout onClick={logout} /></div>
    </div>
  )
}

export default function Profile() {
  const { role, identity, user, saveProfile, mySubjects, logout, toast } = useApp()
  const [error, setError] = useState('')

  const onSubmit = async e => {
    e.preventDefault()
    const v = Object.fromEntries([...new FormData(e.currentTarget)].map(([k, x]) => [k, String(x).trim()]))
    if (!v.first || !v.last) { setError('Vnesite ime in priimek.'); return }
    try {
      await saveProfile(v)
      setError('')
      toast('Profil je shranjen.')
    } catch (err) {
      setError(err.message)
    }
  }

  let content
  if (role === 'admin') {
    content = <AdminProfile />
  } else {
    const fields = role === 'ucitelj' ? (
      <div className="profile-fields">
        {teacherFields.map(([name, label, type, required, autoComplete]) => (
          <label className="field" key={name}>
            {label}
            <input name={name} type={type} defaultValue={user[name] || ''} maxLength={100} autoComplete={autoComplete} required={required} />
          </label>
        ))}
        <div className="field">Predmeti, ki jih poučujete<span className="field-value">{mySubjects.map(s => s.name).join(', ') || '—'}</span></div>
      </div>
    ) : <ProfileFields values={user} emailRequired />
    content = (
      <form className="profile-panel" onSubmit={onSubmit}>
        <Banner identity={identity} username={user.username} />
        {fields}
        <p className="form-error" role="alert">{error}</p>
        <div className="profile-footer">
          <Logout onClick={logout} />
          <button className="ui-button primary" type="submit">Shrani spremembe</button>
        </div>
      </form>
    )
  }

  return (
    <>
      <PageHeader title="Profil" />
      {content}
      <PasswordForm />
    </>
  )
}
