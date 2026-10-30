import { useEffect, useState } from 'react'
import AssignmentDialog from '../components/AssignmentDialog.jsx'
import Icon from '../components/Icon.jsx'
import NoSubjects from '../components/NoSubjects.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { api } from '../lib/api.js'
import { localIso } from '../lib/helpers.js'
import { useApp } from '../context/appContext.js'

const weekdays = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned']
const firstOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
const kindLabels = { test: 'Test', ustno: 'Ustno', dogodek: 'Dogodek', pocitnice: 'Počitnice' }

// Prvi dan mreže (ponedeljek pred 1. v mesecu) in 42 dni prikaza.
function gridDays(month) {
  const start = new Date(month)
  start.setDate(1 - ((start.getDay() + 6) % 7))
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

// Učenec: mesečni koledar z roki nalog ter testi in dogodki iz baze.
export default function Calendar() {
  const { assignments, subjects, selected, submissions, toast } = useApp()
  const [month, setMonth] = useState(firstOfMonth)
  const [events, setEvents] = useState([])
  const [openId, setOpenId] = useState(null)
  const days = gridDays(month)
  const from = localIso(days[0])
  const to = localIso(days[days.length - 1])

  useEffect(() => {
    let active = true
    api.get(`/calendar?from=${from}&to=${to}`)
      .then(rows => { if (active) setEvents(rows.filter(r => r.source === 'event')) })
      .catch(err => toast(err.message))
    return () => { active = false }
  }, [from, to, selected, toast])

  if (!selected.length) return <><PageHeader title="Koledar" /><NoSubjects /></>

  const today = new Date().toDateString()
  const visible = assignments.filter(a => selected.includes(a.subject))
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
                    key={`a${a.id}`}
                    className="calendar-event"
                    type="button"
                    onClick={() => setOpenId(a.id)}
                    title={`${a.title} · ${subjects.find(s => s.id === a.subject)?.name || ''}`}
                  >
                    {a.title}{submissions[a.id] ? ' (oddano)' : ''}
                  </button>
                ))}
                {events.filter(e => e.date === iso).map(e => (
                  <span
                    key={`e${e.id}`}
                    className={`calendar-event is-event ${e.kind}`}
                    title={`${kindLabels[e.kind] || ''}: ${e.title}${e.subjectName ? ` · ${e.subjectName}` : ' · vsa šola'}${e.time ? ` · ${e.time}` : ''}`}
                  >
                    {e.time ? `${e.time} ` : ''}{e.title}
                  </span>
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
