import Icon from './Icon.jsx'
import { dateLabel, dateTime } from '../lib/helpers.js'
import { downloadSubmission, submissionsFor } from '../lib/staff.js'
import { useApp } from '../context/appContext.js'

export function SubmissionDownload({ row }) {
  return (
    <button className="icon-button" type="button" onClick={() => downloadSubmission(row)} aria-label={`Prenesi oddajo: ${row.who}`}>
      <Icon name="down" />
    </button>
  )
}

// Učitelj: razgrinjena skupina oddaj za eno nalogo.
export default function SubmissionGroup({ assignment, open }) {
  const { store, submissions, profile } = useApp()
  const rows = submissionsFor(assignment, { students: store.students, submissions, profile })
  const done = rows.filter(r => r.submitted).length
  return (
    <details className="submission-group" open={open}>
      <summary>
        <span className="row-title">
          {assignment.title}
          <span className="row-sep" aria-hidden="true">|</span>
          <time className="row-date" dateTime={assignment.due}>{dateLabel(assignment.due)}</time>
          <span className="row-sep" aria-hidden="true">|</span>
          <span className="row-status">{done} / {rows.length} oddanih</span>
        </span>
      </summary>
      <div className="list-surface">
        <table className="file-table">
          <thead>
            <tr>
              <th scope="col">Učenec</th>
              <th scope="col">Status</th>
              <th className="optional-column" scope="col">Oddano</th>
              <th scope="col"><span className="sr-only">Prenos</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key}>
                <td>{r.who}</td>
                <td>{r.submitted ? <span className="badge done"><Icon name="tick" />Oddano</span> : <span className="badge">Ni oddano</span>}</td>
                <td className="optional-column">{r.submitted ? dateTime(r.savedAt) : '—'}</td>
                <td>{r.submitted && <SubmissionDownload row={r} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
