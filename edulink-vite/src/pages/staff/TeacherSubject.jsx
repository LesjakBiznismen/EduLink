import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import EmptyState from '../../components/EmptyState.jsx'
import Icon from '../../components/Icon.jsx'
import MaterialDialog from '../../components/MaterialDialog.jsx'
import SubmissionGroup from '../../components/SubmissionGroup.jsx'
import { dateLabel, imgSrc, plural } from '../../lib/helpers.js'
import { downloadMaterial } from '../../lib/materials.js'
import { useApp } from '../../context/appContext.js'
import { AssignmentCreateDialog, MaterialDeleteDialog, MaterialUploadDialog } from './TeacherDialogs.jsx'

// Učitelj: stran predmeta z nalogami (oddajami) in gradivi.
export default function TeacherSubject() {
  const { id } = useParams()
  const { mySubjects, store, assignments, materials } = useApp()
  const [dialog, setDialog] = useState(null) // {type: 'assignment' | 'upload' | 'delete' | 'view', id?}
  const subject = mySubjects.find(s => s.id === id)

  useEffect(() => {
    document.title = `${subject?.name || 'Predmet'} · EduLink`
  }, [subject])

  if (!subject) return <EmptyState title="Predmeta ne poučujete" copy="Odprite enega od svojih predmetov." />

  const students = store.students.filter(x => x.subjects.includes(id)).length
  const list = assignments.filter(a => a.subject === id).sort((a, b) => a.due.localeCompare(b.due))
  const mats = materials.filter(m => m.subject === id)
  const close = () => setDialog(null)

  return (
    <>
      <section className="subject-intro">
        <img src={imgSrc(subject)} alt="" />
        <div>
          <h1>{subject.name}</h1>
          <div className="teacher-line"><span>{plural(students, 'učenec', 'učenca', 'učenci', 'učencev')}</span></div>
        </div>
      </section>
      <div className="subject-columns">
        <section>
          <div className="section-title">
            <h2>Naloge</h2>
            <button className="ui-button small primary" type="button" onClick={() => setDialog({ type: 'assignment' })}><Icon name="plus" /> Dodaj nalogo</button>
          </div>
          {list.map((a, i) => <SubmissionGroup key={a.id} assignment={a} open={i === 0} />)}
        </section>
        <section>
          <div className="section-title">
            <h2>Gradiva</h2>
            <button className="ui-button small primary" type="button" onClick={() => setDialog({ type: 'upload' })}><Icon name="plus" /> Naloži</button>
          </div>
          {mats.length ? (
            <div className="list-surface">
              {mats.map(m => (
                <div className="file-row" key={m.id}>
                  <span className="file-symbol"><Icon name="file" /></span>
                  <button className="file-title" type="button" onClick={() => setDialog({ type: 'view', id: m.id })}>
                    {m.title}<span className="file-subject">{m.type} · {dateLabel(m.added)}</span>
                  </button>
                  <button className="icon-button" type="button" onClick={() => downloadMaterial(m, subject.name)} aria-label={`Prenesi ${m.title}`}><Icon name="down" /></button>
                  <button className="icon-button" type="button" onClick={() => setDialog({ type: 'delete', id: m.id })} aria-label={`Izbriši ${m.title}`}><Icon name="trash" /></button>
                </div>
              ))}
            </div>
          ) : <EmptyState title="Ni gradiv" copy="Naložite prvo gradivo za ta predmet." />}
        </section>
      </div>
      {dialog?.type === 'assignment' && <AssignmentCreateDialog subjectId={id} onClose={close} />}
      {dialog?.type === 'upload' && <MaterialUploadDialog subjectId={id} onClose={close} />}
      {dialog?.type === 'delete' && <MaterialDeleteDialog materialId={dialog.id} onClose={close} />}
      {dialog?.type === 'view' && <MaterialDialog materialId={dialog.id} onClose={close} />}
    </>
  )
}
