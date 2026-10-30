import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AssignmentDialog from '../components/AssignmentDialog.jsx'
import AssignmentRow from '../components/AssignmentRow.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import NoSubjects from '../components/NoSubjects.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { normalize } from '../lib/helpers.js'
import { useApp } from '../context/appContext.js'

// Učenec: seznam nalog z iskanjem in filtrom po predmetu.
export default function Assignments() {
  const { studentSubjects, subjects, assignments, selected } = useApp()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [subject, setSubject] = useState('')
  const [openId, setOpenId] = useState(null)

  if (!selected.length) return <><PageHeader title="Naloge" /><NoSubjects /></>

  const q = normalize(query)
  const items = assignments
    .filter(a => selected.includes(a.subject))
    .sort((a, b) => a.due.localeCompare(b.due))
    .filter(a => (!subject || a.subject === subject) && normalize(`${a.title} ${subjects.find(s => s.id === a.subject).name}`).includes(q))

  return (
    <>
      <PageHeader title="Naloge" />
      <div className="toolbar">
        <label className="search-field">
          <Icon name="search" />
          <input type="search" aria-label="Poišči nalogo" placeholder="Poišči nalogo" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <div className="filters">
          <select aria-label="Filtriraj po predmetu" value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">Vsi predmeti</option>
            {studentSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      {items.length ? (
        <div className="list-surface">
          {items.map(a => <AssignmentRow key={a.id} assignment={a} onOpen={setOpenId} />)}
        </div>
      ) : (
        <EmptyState title="Ni nalog za ta izbor" copy="Poskusite drug predmet, status ali iskalni izraz.">
          <button className="ui-button small" type="button" onClick={() => { setQuery(''); setSubject('') }}>Počisti filtre</button>
        </EmptyState>
      )}
      {openId && <AssignmentDialog assignmentId={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
