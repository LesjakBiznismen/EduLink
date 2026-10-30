import Icon from './Icon.jsx'
import { dateLabel, dateValue, imgSrc } from '../lib/helpers.js'
import { useApp } from '../context/appContext.js'

export function AssignmentStatus({ assignment }) {
  const { submissions } = useApp()
  const saved = submissions[assignment.id]
  if (saved?.grade) return <span className="badge done"><Icon name="tick" />Ocena {saved.grade}</span>
  if (saved) return <span className="badge done"><Icon name="tick" />Oddano</span>
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return dateValue(assignment.due) < today
    ? <span className="badge late"><Icon name="warn" />Rok je potekel</span>
    : <span className="badge">Za oddajo</span>
}

export default function AssignmentRow({ assignment, onOpen }) {
  const { subjects, submissions } = useApp()
  const subject = subjects.find(s => s.id === assignment.subject)
  return (
    <article className="assignment-row">
      <img className="row-thumb" src={imgSrc(subject)} alt="" />
      <div>
        <h3 className="row-title">
          {assignment.title}
          <span className="row-sep" aria-hidden="true">|</span>
          <time className="row-date" dateTime={assignment.due}>{dateLabel(assignment.due)}</time>
        </h3>
        <p className="row-meta">{subject.name}</p>
      </div>
      <div className="due-column"><AssignmentStatus assignment={assignment} /></div>
      <button className="ui-button small" type="button" onClick={() => onOpen(assignment.id)}>
        {submissions[assignment.id] ? 'Poglej oddajo' : 'Odpri nalogo'}
      </button>
    </article>
  )
}
