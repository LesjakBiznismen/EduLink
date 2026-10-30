import { useState } from 'react'
import AssignmentDialog from '../components/AssignmentDialog.jsx'
import Icon from '../components/Icon.jsx'
import NoSubjects from '../components/NoSubjects.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { localIso } from '../lib/helpers.js'
import { useApp } from '../context/appContext.js'

const weekdays = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned']
const firstOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)

// Učenec: mesečni koledar z roki nalog.
export default function Calendar() {
  const { assignments, subjects, selected, submissions } = useApp()
  const [month, setMonth] = useState(firstOfMonth)
  const [openId, setOpenId] = useState(null)

  if (!selected.length) return <><PageHeader title="Koledar" /><NoSubjects /></>

  const start = new Date(month)
  start.setDate(1 - ((start.getDay() + 6) % 7))
  const today = new Date().toDateString()
  const visible = assignments.filter(a => selected.includes(a.subject))
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
  const step = n => setMonth(m => new Date(m.getFullYear(), m.getMonth() + n, 1))

  return (
    <>
      <PageHeader title="Koledar" />
      <div className="toolbar">
        <div className="calendar-controls">
          <button className="ui-button small" type="button" onClick={() => step(-1)} aria-label="Prejšnji mesec"><Icon name="left" /></button>
          <h2 aria-live="polite">{month.toLocaleDateString('sl-SI', { month: 'long', year: 'numeric' })}</h2>
          <button className="ui-button small" type="button" onClick={() => step(1)} aria-label="Naslednji mesec"><Icon name="right" /></button>
        </div>
        <button className="ui-button small" type="button" onClick={() => setMonth(firstOfMonth())}>Danes</button>
      </div>
      <div className="calendar-scroll">
        <div className="calendar-grid">
          {weekdays.map(d => <div className="weekday" key={d}>{d}</div>)}
          {days.map(d => {
            const iso = localIso(d)
            const isToday = d.toDateString() === today
            return (
              <div key={iso} className={`calendar-day ${d.getMonth() !== month.getMonth() ? 'outside' : ''} ${isToday ? 'is-today' : ''}`}>
                <span className="day-number" aria-current={isToday ? 'date' : undefined}>{d.getDate()}</span>
                {visible.filter(a => a.due === iso).map(a => (
                  <button
                    key={a.id}
                    className="calendar-event"
                    type="button"
                    onClick={() => setOpenId(a.id)}
                    title={`${a.title} · ${subjects.find(s => s.id === a.subject).name}`}
                  >
                    {a.title}{submissions[a.id] ? ' (oddano)' : ''}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
      {openId && <AssignmentDialog assignmentId={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
