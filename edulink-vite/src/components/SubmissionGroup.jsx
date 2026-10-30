import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { api } from '../lib/api.js'
import { dateLabel, dateTime, fullName } from '../lib/helpers.js'
import { downloadSubmission } from '../lib/staff.js'
import { useApp } from '../context/appContext.js'

export function SubmissionDownload({ submission, who }) {
  const { toast } = useApp()
  return (
    <button className="icon-button" type="button" onClick={() => downloadSubmission(submission).catch(err => toast(err.message))} aria-label={`Prenesi oddajo: ${who}`}>
      <Icon name="down" />
    </button>
  )
}

// Ocena oddaje (1–5); sprememba se takoj shrani na strežnik.
export function GradeSelect({ submission, who, onChange }) {
  const { toast } = useApp()
  const change = async e => {
    try {
      const value = e.target.value
      const next = await api.patch(`/submissions/${submission.id}/grade`, { grade: value || null, feedback: submission.feedback })
      onChange?.(next)
      toast(value ? `Ocena ${value} je shranjena.` : 'Ocena je odstranjena.')
    } catch (err) {
      toast(err.message)
    }
  }
  return (
    <select className="grade-select" aria-label={`Ocena: ${who}`} value={submission.grade ?? ''} onChange={change}>
      <option value="">—</option>
      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
    </select>
  )
}

// Učitelj: razgrinjena skupina oddaj za eno nalogo (vsi vpisani učenci).
export default function SubmissionGroup({ assignment, open }) {
  const { toast } = useApp()
  const [rows, setRows] = useState(null)

  useEffect(() => {
    let active = true
    api.get(`/assignments/${assignment.id}/submissions`)
      .then(data => { if (active) setRows(data) })
      .catch(err => toast(err.message))
    return () => { active = false }
  }, [assignment.id, toast])

  const update = next => setRows(current => current.map(r => (r.submission?.id === next.id ? { ...r, submission: { ...r.submission, ...next } } : r)))
  const done = rows?.filter(r => r.submission).length ?? 0

  return (
    <details className="submission-group" open={open}>
      <summary>
        <span className="row-title">
          {assignment.title}
          <span className="row-sep" aria-hidden="true">|</span>
          <time className="row-date" dateTime={assignment.due}>{dateLabel(assignment.due)}</time>
          <span className="row-sep" aria-hidden="true">|</span>
          <span className="row-status">{rows ? `${done} / ${rows.length} oddanih` : 'Nalaganje …'}</span>
        </span>
      </summary>
      <div className="list-surface">
        <table className="file-table">
          <thead>
            <tr>
              <th scope="col">Učenec</th>
              <th scope="col">Status</th>
              <th className="optional-column" scope="col">Oddano</th>
              <th scope="col">Ocena</th>
              <th scope="col"><span className="sr-only">Prenos</span></th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map(({ student, submission }) => (
              <tr key={student.id}>
                <td>{fullName(student)}</td>
                <td>{submission ? <span className="badge done"><Icon name="tick" />Oddano</span> : <span className="badge">Ni oddano</span>}</td>
                <td className="optional-column">{submission ? dateTime(submission.savedAt) : '—'}</td>
                <td>{submission && <GradeSelect submission={submission} who={fullName(student)} onChange={update} />}</td>
                <td>{submission && <SubmissionDownload submission={submission} who={fullName(student)} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
