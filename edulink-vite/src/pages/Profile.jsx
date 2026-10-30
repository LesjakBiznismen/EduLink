import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import PageHeader from '../components/PageHeader.jsx'
import ProfileFields from '../components/ProfileFields.jsx'
import { useApp } from '../context/appContext.js'

const teacherFields = [
  ['first', 'Ime', 'text', true, 'given-name'],
  ['last', 'Priimek', 'text', true, 'family-name'],
  ['email', 'E-naslov', 'email', false, 'email'],
  ['phone', 'Telefon', 'tel', false, 'tel'],
  ['title', 'Naziv', 'text', false, 'honorific-prefix'],
  ['office', 'Kabinet', 'text', false, 'off'],
  ['school', 'Šola', 'text', false, 'organization'],
]

function Banner({ identity }) {
  return (
    <div className="profile-banner">
      <span className="avatar" aria-hidden="true">{identity.initials}</span>
      <div>
        <h2>{identity.name}</h2>
        <span className="badge accent">{identity.label}</span>
      </div>
    </div>
  )
}

const Logout = ({ onClick }) => (
  <Link className="ui-button" to="/prijava" onClick={onClick}><Icon name="logout" /> Odjava</Link>
)

export default function Profile() {
  const { role, identity, profile, saveProfile, teacher, subjects, store, updateStore, logout, toast } = useApp()
  const [error, setError] = useState('')

  if (role === 'admin') {
    return (
      <>
        <PageHeader title="Profil" />
        <div className="profile-panel">
          <Banner identity={identity} />
          <p className="note">{store.subjects.length} predmetov · {store.teachers.length} učiteljev · {store.students.length} učencev</p>
          <div className="profile-footer"><Logout onClick={logout} /></div>
        </div>
      </>
    )
  }

  if (role === 'ucitelj') {
    const onSubmit = e => {
      e.preventDefault()
      const v = Object.fromEntries([...new FormData(e.currentTarget)].map(([k, x]) => [k, String(x).trim()]))
      if (!v.first || !v.last) { setError('Vnesite ime in priimek.'); return }
      setError('')
      updateStore(s => Object.assign(s.teachers.find(t => t.id === teacher.id), v))
      toast('Profil je shranjen.')
    }
    const taught = teacher.subjects.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(', ')
    return (
      <>
        <PageHeader title="Profil" />
        <form className="profile-panel" onSubmit={onSubmit}>
          <Banner identity={identity} />
          <div className="profile-fields">
            {teacherFields.map(([name, label, type, required, autoComplete]) => (
              <label className="field" key={name}>
                {label}
                <input name={name} type={type} defaultValue={teacher[name] || ''} maxLength={100} autoComplete={autoComplete} required={required} />
              </label>
            ))}
            <div className="field">Predmeti, ki jih poučujete<span className="field-value">{taught || '—'}</span></div>
          </div>
          <p className="form-error" role="alert">{error}</p>
          <div className="profile-footer">
            <Logout onClick={logout} />
            <button className="ui-button primary" type="submit">Shrani spremembe</button>
          </div>
        </form>
      </>
    )
  }

  const onSubmit = e => {
    e.preventDefault()
    const values = Object.fromEntries(new FormData(e.currentTarget))
    if (!values.first?.trim() || !values.last?.trim()) { setError('Vnesite ime in priimek.'); return }
    try {
      saveProfile(values)
      setError('')
      toast('Profil je shranjen.')
    } catch {
      setError('Shranjevanje ni na voljo. Omogočite lokalno shrambo brskalnika.')
    }
  }
  return (
    <>
      <PageHeader title="Profil" />
      <form className="profile-panel" onSubmit={onSubmit}>
        <Banner identity={identity} />
        <ProfileFields values={profile} />
        <p className="form-error" role="alert">{error}</p>
        <div className="profile-footer">
          <Logout onClick={logout} />
          <button className="ui-button primary" type="submit">Shrani spremembe</button>
        </div>
      </form>
    </>
  )
}
