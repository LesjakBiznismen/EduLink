import { useState } from 'react'
import { Link } from 'react-router-dom'
import AssignmentDialog from '../components/AssignmentDialog.jsx'
import AssignmentRow from '../components/AssignmentRow.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import PageHeader from '../components/PageHeader.jsx'
import SubjectCard from '../components/SubjectCard.jsx'
import { useApp } from '../context/appContext.js'

// Učenčeva učilnica: izbrani predmeti in prihajajoči roki.
export default function Classroom() {
  const { studentSubjects, assignments, selected, submissions, setChooserOpen } = useApp()
  const [openId, setOpenId] = useState(null)

  if (!selected.length) {
    return (
      <>
        <PageHeader title="Predmeti" />
        <EmptyState title="Ni izbranih predmetov" copy="Izberite predmete, ki jih obiskujete. Pokazali se bodo skupaj z nalogami in gradivi.">
          <button className="ui-button primary" type="button" onClick={() => setChooserOpen(true)}>
            <Icon name="plus" /> Izberi predmete
          </button>
        </EmptyState>
      </>
    )
  }

  const upcoming = assignments
    .filter(a => selected.includes(a.subject) && !submissions[a.id])
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 4)

  return (
    <>
      <PageHeader title="Predmeti" />
      <div className="predmeti">
        {studentSubjects.map(s => <SubjectCard key={s.id} subject={s} />)}
      </div>
      {upcoming.length > 0 && (
        <>
          <div className="section-title">
            <h2>Prihajajoči roki</h2>
            <Link to="/naloge">Vse naloge</Link>
          </div>
          <div className="list-surface">
            {upcoming.map(a => <AssignmentRow key={a.id} assignment={a} onOpen={setOpenId} />)}
          </div>
        </>
      )}
      {openId && <AssignmentDialog assignmentId={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
