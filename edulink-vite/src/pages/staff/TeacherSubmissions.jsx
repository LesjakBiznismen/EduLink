import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EmptyState from '../../components/EmptyState.jsx'
import Icon from '../../components/Icon.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Pager from '../../components/Pager.jsx'
import { SubmissionDownload } from '../../components/SubmissionGroup.jsx'
import { dateTime, normalize } from '../../lib/helpers.js'
import { paginate, submissionsFor } from '../../lib/staff.js'
import { useApp } from '../../context/appContext.js'

// Učitelj: vse oddane naloge pri njegovih predmetih.
export default function TeacherSubmissions() {
  const { mySubjects, assignments, store, submissions, profile, subjects } = useApp()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [subject, setSubject] = useState('')
  const [page, setPage] = useState(1)

  if (!mySubjects.length) {
    return <><PageHeader title="Oddaje" /><EmptyState title="Nimate predmetov" copy="Administrator vam še ni dodelil predmeta." /></>
  }

  const mine = new Set(mySubjects.map(s => s.id))
  const q = normalize(query)
  const items = assignments
    .filter(a => mine.has(a.subject))
    .flatMap(a => submissionsFor(a, { students: store.students, submissions, profile }).filter(r => r.submitted))
    .filter(r => (!subject || r.assignment.subject === subject) && normalize(`${r.who} ${r.assignment.title}`).includes(q))
    .sort((x, y) => y.savedAt.localeCompare(x.savedAt))
  const pg = paginate(items, page)

  return (
    <>
      <PageHeader title="Oddaje" />
      <div className="toolbar">
        <label className="search-field">
          <Icon name="search" />
          <input type="search" aria-label="Poišči oddajo" placeholder="Poišči oddajo" value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} />
        </label>
        <div className="filters">
          <select aria-label="Filtriraj po predmetu" value={subject} onChange={e => { setSubject(e.target.value); setPage(1) }}>
            <option value="">Vsi moji predmeti</option>
            {mySubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      {items.length ? (
        <>
          <div className="list-surface">
            <table className="file-table">
              <thead>
                <tr>
                  <th scope="col">Učenec</th>
                  <th scope="col">Naloga</th>
                  <th className="optional-column" scope="col">Predmet</th>
                  <th className="optional-column" scope="col">Oddano</th>
                  <th scope="col"><span className="sr-only">Prenos</span></th>
                </tr>
              </thead>
              <tbody>
                {pg.slice.map(r => (
                  <tr key={r.key}>
                    <td>{r.who}</td>
                    <td>{r.assignment.title}</td>
                    <td className="optional-column">{subjects.find(s => s.id === r.assignment.subject)?.name || ''}</td>
                    <td className="optional-column">{dateTime(r.savedAt)}</td>
                    <td><SubmissionDownload row={r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager pg={pg} onPage={setPage} />
        </>
      ) : <EmptyState title="Ni oddaj" copy="Za izbrani predmet ali iskalni izraz ni oddanih nalog." />}
    </>
  )
}
