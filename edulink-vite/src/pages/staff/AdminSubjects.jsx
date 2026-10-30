import { useEffect, useState } from 'react'
import CheckList from '../../components/CheckList.jsx'
import DeleteDialog from '../../components/DeleteDialog.jsx'
import Dialog from '../../components/Dialog.jsx'
import Icon from '../../components/Icon.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { imageOptions } from '../../data/subjects.js'
import { api } from '../../lib/api.js'
import { fullName, imgSrc } from '../../lib/helpers.js'
import { useApp } from '../../context/appContext.js'

function SubjectDialog({ subject, teachers, onClose }) {
  const { reloadSubjects, toast } = useApp()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const teacherIds = subject ? subject.teachers.map(t => String(t.id)) : []

  const onSubmit = async e => {
    e.preventDefault()
    const values = new FormData(e.currentTarget)
    const name = String(values.get('name')).trim()
    const checked = values.getAll('rel').map(Number)
    if (!name) { setError('Vnesite ime predmeta.'); return }
    if (!checked.length) { setError('Izberite vsaj enega učitelja.'); return }
    const body = { name, image: values.get('image'), teachers: checked }
    setBusy(true)
    try {
      if (subject) await api.put(`/subjects/${subject.id}`, body)
      else await api.post('/subjects', body)
      await reloadSubjects()
      onClose()
      toast('Predmet je shranjen.')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Dialog
      title={subject ? 'Uredi predmet' : 'Nov predmet'}
      onClose={onClose}
      actions={(
        <>
          <button className="ui-button" type="button" onClick={onClose}>Prekliči</button>
          <button className="ui-button primary" type="submit" form="subject-form" disabled={busy}>Shrani</button>
        </>
      )}
    >
      <form id="subject-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="field">Ime predmeta<input name="name" required maxLength={80} defaultValue={subject?.name || ''} /></label>
          <label className="field">
            Slika
            <select name="image" defaultValue={subject?.image || 'privzeto.svg'}>
              {imageOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <fieldset className="field-set">
            <legend>Učitelji, ki poučujejo predmet</legend>
            <CheckList items={teachers.map(t => ({ id: String(t.id), label: fullName(t) }))} checkedIds={teacherIds} />
          </fieldset>
          <p className="form-error" role="alert">{error}</p>
        </div>
      </form>
    </Dialog>
  )
}

// Administrator: pregled predmetov, dodajanje, urejanje in brisanje.
export default function AdminSubjects() {
  const { subjects, reloadSubjects, toast } = useApp()
  const [teachers, setTeachers] = useState([])
  const [editing, setEditing] = useState(null) // null | '' (nov) | koda predmeta
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    api.get('/users?role=ucitelj').then(setTeachers).catch(err => toast(err.message))
  }, [toast])

  const toDelete = subjects.find(s => s.id === deleting)

  return (
    <>
      <PageHeader title="Predmeti">
        <button className="ui-button primary" type="button" onClick={() => setEditing('')}><Icon name="plus" /> Dodaj predmet</button>
      </PageHeader>
      <div className="list-surface">
        <table className="file-table">
          <thead>
            <tr>
              <th scope="col">Predmet</th>
              <th className="optional-column" scope="col">Učitelji</th>
              <th className="optional-column" scope="col">Učenci</th>
              <th scope="col"><span className="sr-only">Dejanja</span></th>
            </tr>
          </thead>
          <tbody>
            {subjects.map(s => (
              <tr key={s.id}>
                <td><div className="file-name"><img className="table-thumb" src={imgSrc(s)} alt="" /><strong>{s.name}</strong></div></td>
                <td className="optional-column">{s.teachers.map(fullName).join(', ') || '—'}</td>
                <td className="optional-column">{s.studentCount}</td>
                <td>
                  <div className="row-actions">
                    <button className="ui-button small" type="button" onClick={() => setEditing(s.id)}>Uredi</button>
                    <button className="ui-button small" type="button" onClick={() => setDeleting(s.id)}>Izbriši</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing !== null && (
        <SubjectDialog subject={subjects.find(s => s.id === editing)} teachers={teachers} onClose={() => setEditing(null)} />
      )}
      {toDelete && (
        <DeleteDialog
          name={toDelete.name}
          note=" Izbrisane bodo tudi njegove naloge, oddaje in gradiva."
          onConfirm={async () => { await api.delete(`/subjects/${toDelete.id}`); await reloadSubjects() }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}
