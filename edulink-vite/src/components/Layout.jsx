import { Fragment, useEffect } from 'react'
import { Link, Navigate, Outlet, useLocation, useMatch, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from './Icon.jsx'
import SubjectChooser from './SubjectChooser.jsx'
import { plural } from '../lib/helpers.js'
import { useApp } from '../context/appContext.js'

const routesByRole = {
  ucenec: [['/predmeti', 'Predmeti', 'grid'], ['/naloge', 'Naloge', 'check'], ['/gradiva', 'Gradiva', 'folder'], ['/koledar', 'Koledar', 'calendar']],
  ucitelj: [['/predmeti', 'Predmeti', 'grid'], ['/naloge', 'Oddaje', 'check'], ['/gradiva', 'Gradiva', 'folder']],
  admin: [['/predmeti', 'Predmeti', 'grid'], ['/ucitelji', 'Učitelji', 'user'], ['/ucenci', 'Učenci', 'users']],
}
const placeholders = { ucenec: 'Poišči naloge', ucitelj: 'Poišči oddajo', admin: 'Poišči učenca' }

// Okvir aplikacije: zgornja vrstica, stranska navigacija in seznam predmetov.
export default function Layout() {
  const { ready, role, identity, logout, studentSubjects, mySubjects, assignments, selected, submissions, chooserOpen, setChooserOpen } = useApp()
  const { pathname, search } = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const subjectMatch = useMatch('/predmeti/:id')

  useEffect(() => {
    if (subjectMatch || !role) return
    const names = { '/predmeti': 'Predmeti', '/naloge': role === 'ucitelj' ? 'Oddaje' : 'Naloge', '/gradiva': 'Gradiva', '/koledar': 'Koledar', '/profil': 'Profil', '/ucitelji': 'Učitelji', '/ucenci': 'Učenci' }
    document.title = `${names[pathname] || 'EduLink'} · EduLink`
  }, [pathname, role, subjectMatch])

  if (!ready) return <p className="app-loading" role="status">Nalaganje …</p>
  if (!role) return <Navigate to="/prijava" replace />

  const isStaff = role !== 'ucenec'
  const routes = routesByRole[role]
  const openCount = assignments.filter(a => selected.includes(a.subject) && !submissions[a.id]).length
  const listed = role === 'ucenec' ? studentSubjects : mySubjects
  const activeId = subjectMatch?.params.id
  const showCourses = pathname.startsWith('/predmeti') && role !== 'admin' && !(role === 'ucitelj' && mySubjects.length === 1)

  const profileChip = (
    <>
      <span>{identity.name}</span>
      <span className="avatar" aria-hidden="true">{identity.initials}</span>
    </>
  )

  const onSearch = e => {
    e.preventDefault()
    const q = new FormData(e.currentTarget).get('q').trim()
    navigate(`${role === 'admin' ? '/ucenci' : '/naloge'}${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  return (
    <>
      <div className="app">
        <a className="skip-link" href="#main">Preskoči na vsebino</a>
        <header className="topbar">
          <Link className="brand" to="/predmeti" aria-label="EduLink – predmeti">
            <img src="/slike/edulink-logo.png" alt="EduLink" />
          </Link>
          <form className="topbar-search" role="search" onSubmit={onSearch} key={params.get('q') || ''}>
            <Icon name="search" />
            <input name="q" type="search" placeholder={placeholders[role]} aria-label={placeholders[role]} defaultValue={params.get('q') || ''} />
          </form>
          <Link className="top-profile" to="/profil">{profileChip}</Link>
        </header>
        <div className="frame">
          <aside className="rail">
            <nav className="rail-nav" aria-label="Glavna navigacija">
              {routes.map(([to, label, glyph]) => (
                <Link className="rail-link" to={to} key={to} aria-current={pathname.startsWith(to) ? 'page' : undefined}>
                  <Icon name={glyph} />
                  <span>{label}</span>
                  {to === '/naloge' && !isStaff && openCount > 0 && (
                    <span className="rail-badge" aria-label={`${plural(openCount, 'naloga', 'nalogi', 'nalogi', 'nalog')} za oddajo`}>{openCount}</span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="rail-footer">
              <Link className="rail-link" to="/profil" aria-current={pathname === '/profil' ? 'page' : undefined}>
                <Icon name="user" /><span>Profil</span>
              </Link>
              <Link className="rail-link" to="/prijava" onClick={logout}><Icon name="logout" /><span>Odjava</span></Link>
            </div>
          </aside>
          <div className={`workspace ${showCourses ? '' : 'no-courses'}`}>
            <aside className="courses" aria-label="Moji predmeti">
              <div className="courses-head">
                <h2>Predmeti</h2>
                {!isStaff && (
                  <button className="icon-button" type="button" onClick={() => setChooserOpen(true)} aria-label="Izberi predmete" title="Izberi predmete">
                    <Icon name="plus" />
                  </button>
                )}
              </div>
              {listed.length ? (
                <nav aria-label="Seznam predmetov">
                  {listed.map(s => (
                    <Link className="course-link" to={`/predmeti/${s.id}`} key={s.id} aria-current={activeId === s.id ? 'page' : undefined}>
                      <span>{s.name}</span>
                    </Link>
                  ))}
                </nav>
              ) : <p className="courses-empty">{isStaff ? 'Nimate predmetov.' : 'Ni izbranih predmetov.'}</p>}
            </aside>
            <main className="app-main" id="main" tabIndex={-1}>
              <Fragment key={pathname + search}><Outlet /></Fragment>
            </main>
          </div>
        </div>
      </div>
      {chooserOpen && !isStaff && <SubjectChooser onClose={() => setChooserOpen(false)} />}
    </>
  )
}
