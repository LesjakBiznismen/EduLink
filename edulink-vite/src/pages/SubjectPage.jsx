import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AssignmentDialog from '../components/AssignmentDialog.jsx'
import AssignmentRow from '../components/AssignmentRow.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import MaterialDialog from '../components/MaterialDialog.jsx'
import { fullName, imgSrc, initials } from '../lib/helpers.js'
import { useApp } from '../context/appContext.js'

// Učenec: stran predmeta z nalogami in gradivi.
export default function SubjectPage() {
  const { id } = useParams()
  const { subjects, assignments, materials, selected, saveSelection, downloadMaterial } = useApp()
  const [assignmentId, setAssignmentId] = useState(null)
  const [materialId, setMaterialId] = useState(null)
  const subject = subjects.find(s => s.id === id)

  useEffect(() => {
    document.title = `${subject?.name || 'Predmet'} · EduLink`
  }, [subject])

  if (!subject) {
    return (
      <EmptyState title="Predmet ni najden" copy="Vrnite se med predmete in izberite enega od njih.">
        <Link className="ui-button" to="/predmeti">Nazaj na predmete</Link>
      </EmptyState>
    )
  }

  const list = assignments.filter(a => a.subject === subject.id)
  const files = materials.filter(m => m.subject === subject.id)

  return (
    <>
      <section className="subject-intro">
        <img src={imgSrc(subject)} alt="" />
        <div>
          <h1>{subject.name}</h1>
          {subject.teachers.map(t => (
            <div className="teacher-line" key={t.id}>
              <span className="avatar" aria-hidden="true">{initials(t)}</span>
              <span>{fullName(t)} · učitelj</span>
            </div>
          ))}
        </div>
      </section>
      {!selected.includes(subject.id) && (
        <div className="banner">
          <span>Niste vpisani v ta predmet. Po vpisu boste videli njegove naloge in gradiva.</span>
          <button className="ui-button small primary" type="button" onClick={() => saveSelection([...selected, subject.id])}>Vpiši se</button>
        </div>
      )}
      <div className="subject-columns">
        <section className="subject-view" aria-labelledby="naloge-naslov">
          <div className="section-title"><h2 id="naloge-naslov">Naloge</h2></div>
          {list.length ? (
            <div className="list-surface">
              {list.map(a => <AssignmentRow key={a.id} assignment={a} onOpen={setAssignmentId} />)}
            </div>
          ) : <p className="note">Ni nalog.</p>}
        </section>
        <section aria-labelledby="gradiva-naslov">
          <div className="section-title"><h2 id="gradiva-naslov">Gradiva</h2></div>
          {!files.length && <p className="note">Ni gradiv.</p>}
          <div className="list-surface" hidden={!files.length}>
            {files.map(m => (
              <div className="file-row" key={m.id}>
                <span className="file-symbol"><Icon name="file" /></span>
                <button className="file-title" type="button" onClick={() => setMaterialId(m.id)}>
                  {m.title}<span className="file-subject">{m.type}</span>
                </button>
                <button className="icon-button" type="button" onClick={() => downloadMaterial(m, subject.name)} aria-label={`Prenesi ${m.title}`}>
                  <Icon name="down" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
      {assignmentId && <AssignmentDialog assignmentId={assignmentId} onClose={() => setAssignmentId(null)} />}
      {materialId && <MaterialDialog materialId={materialId} onClose={() => setMaterialId(null)} />}
    </>
  )
}
