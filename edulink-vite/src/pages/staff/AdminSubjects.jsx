import { useState } from 'react'
import CheckList from '../../components/CheckList.jsx'
import DeleteDialog from '../../components/DeleteDialog.jsx'
import Dialog from '../../components/Dialog.jsx'
import Icon from '../../components/Icon.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { imageOptions } from '../../data/subjects.js'
import { fullName, imgSrc } from '../../lib/helpers.js'
import { useApp } from '../../context/appContext.js'

function SubjectDialog({ subjectId, onClose }) {
  const { store, updateStore, toast } = useApp()
  const [error, setError] = useState('')
  const subject = subjectId ? store.subjects.find(s => s.id === subjectId) : null
  const teacherIds = subject ? store.teachers.filter(t => t.subjects.includes(subject.id)).map(t => t.id) : []

  const onSubmit = e => {
    e.preventDefault()
    const values = new FormData(e.currentTarget)
    const name = String(values.get('name')).trim()
    const checked = values.getAll('rel')
    if (!name) { setError('Vnesite ime predmeta.'); return }
    if (!checked.length) { setError('Izberite vsaj enega učitelja.'); return }
    updateStore(s => {
      let id = subjectId
      if (id) Object.assign(s.subjects.find(x => x.id === id), { name, image: values.get('image') })
      else {
        const base = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'predmet'
        id = base
        let n = 2
        while (s.subjects.some(x => x.id === id)) id = `${base}-${n++}`
        s.subjects.push({ id, name, image: values.get('image') })
      }
      s.teachers.forEach(t => {
        t.subjects = t.subjects.filter(x => x !== id)
        if (checked.includes(t.id)) t.subjects.push(id)
      })
    })
    onClose()
    toast('Predmet je shranjen.')
  }

  return (
    <Dialog
      title={subject ? 'Uredi predmet' : 'Nov predmet'}
      onClose={onClose}
      actions={(
        <>
          <button className="ui-button" type="button" onClick={onClose}>Prekliči</button>
          <button className="ui-button primary" type="submit" form="subject-form">Shrani</button>
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
            <CheckList items={store.teachers.map(t => ({ id: t.id, label: fullName(t) }))} checkedIds={teacherIds} />
          </fieldset>
          <p className="form-error" role="alert">{error}</p>
        </div>
      </form>
    </Dialog>
  )
}

// Administrator: pregled predmetov, dodajanje, urejanje in brisanje.
export default function AdminSubjects() {
  const { store } = useApp()
  const [editing, setEditing] = useState(null) // null | '' (nov) | id predmeta
  const [deleting, setDeleting] = useState(null)

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
            {store.subjects.map(s => (
              <tr key={s.id}>
                <td><div className="file-name"><img className="table-thumb" src={imgSrc(s)} alt="" /><strong>{s.name}</strong></div></td>
                <td className="optional-column">{store.teachers.filter(t => t.subjects.includes(s.id)).map(fullName).join(', ') || '—'}</td>
                <td className="optional-column">{store.students.filter(x => x.subjects.includes(s.id)).length}</td>
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
      {editing !== null && <SubjectDialog subjectId={editing} onClose={() => setEditing(null)} />}
      {deleting && <DeleteDialog kind="subjects" id={deleting} onClose={() => setDeleting(null)} />}
    </>
  )
}
