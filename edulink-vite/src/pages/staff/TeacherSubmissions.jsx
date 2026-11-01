import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EmptyState from '../../components/EmptyState.jsx'
import Icon from '../../components/Icon.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Pager from '../../components/Pager.jsx'
import { GradeSelect, SubmissionDownload } from '../../components/SubmissionGroup.jsx'
import { api } from '../../lib/api.js'
import { dateTime, fullName, normalize } from '../../lib/helpers.js'
import { paginate } from '../../lib/staff.js'
import { useApp } from '../../context/appContext.js'

// Učitelj: vse oddane naloge pri njegovih predmetih.
export default function TeacherSubmissions() {
  const { mySubjects, subjects, toast } = useApp()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [subject, setSubject] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(null)

  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    api.get('/submissions').then(setRows).catch(err => { toast(err.message); setLoadError(err.message) })
  }, [toast, attempt])

  if (!mySubjects.length) {
    return <><PageHeader title="Oddaje" /><EmptyState title="Nimate predmetov" copy="Administrator vam še ni dodelil predmeta." /></>
  }
  if (loadError && !rows) {
    return (
      <>
        <PageHeader title="Oddaje" />
        <p className="form-error" role="alert">{loadError}</p>
        <button className="ui-button small" type="button" onClick={() => { setLoadError(''); setAttempt(n => n + 1) }}>Poskusi znova</button>
      </>
    )
  }
  if (!rows) return <><PageHeader title="Oddaje" /><p className="note">Nalaganje …</p></>

  const q = normalize(query)
  const items = rows.filter(r => (!subject || r.subject === subject) && normalize(`${fullName(r.student)} ${r.assignmentTitle}`).includes(q))
  const pg = paginate(items, page)
  const update = next => setRows(current => current.map(r => (r.id === next.id ? next : r)))

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
                  <th scope="col">Ocena</th>
                  <th scope="col"><span className="sr-only">Prenos</span></th>
                </tr>
              </thead>
              <tbody>
                {pg.slice.map(r => (
                  <tr key={r.id}>
                    <td>{fullName(r.student)}</td>
                    <td>{r.assignmentTitle}</td>
                    <td className="optional-column">{subjects.find(s => s.id === r.subject)?.name || ''}</td>
                    <td className="optional-column">{dateTime(r.savedAt)}</td>
                    <td><GradeSelect submission={r} who={fullName(r.student)} onChange={update} /></td>
                    <td><SubmissionDownload submission={r} who={fullName(r.student)} /></td>
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
