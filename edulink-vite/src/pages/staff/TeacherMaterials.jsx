import { useState } from 'react'
import EmptyState from '../../components/EmptyState.jsx'
import Icon from '../../components/Icon.jsx'
import MaterialDialog from '../../components/MaterialDialog.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { dateLabel } from '../../lib/helpers.js'
import { useApp } from '../../context/appContext.js'
import { MaterialDeleteDialog, MaterialUploadDialog } from './TeacherDialogs.jsx'

// Učitelj: gradiva pri njegovih predmetih.
export default function TeacherMaterials() {
  const { mySubjects, materials, subjects, downloadMaterial } = useApp()
  const [subject, setSubject] = useState('')
  const [dialog, setDialog] = useState(null) // {type: 'upload' | 'delete' | 'view', id?}

  if (!mySubjects.length) {
    return <><PageHeader title="Gradiva" /><EmptyState title="Nimate predmetov" copy="Administrator vam še ni dodelil predmeta." /></>
  }

  const mine = new Set(mySubjects.map(s => s.id))
  const nameOf = id => subjects.find(s => s.id === id)?.name || ''
  const items = materials.filter(m => mine.has(m.subject) && (!subject || m.subject === subject))
  const close = () => setDialog(null)

  return (
    <>
      <PageHeader title="Gradiva">
        <button className="ui-button primary" type="button" onClick={() => setDialog({ type: 'upload' })}><Icon name="plus" /> Naloži gradivo</button>
      </PageHeader>
      <div className="toolbar">
        <div className="filters">
          <select aria-label="Filtriraj po predmetu" value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">Vsi moji predmeti</option>
            {mySubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      {items.length ? (
        <div className="list-surface">
          <table className="file-table">
            <thead>
              <tr>
                <th scope="col">Ime gradiva</th>
                <th className="optional-column" scope="col">Predmet</th>
                <th className="optional-column" scope="col">Vrsta</th>
                <th className="optional-column" scope="col">Dodano</th>
                <th scope="col"><span className="sr-only">Dejanja</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map(m => (
                <tr key={m.id}>
                  <td>
                    <div className="file-name">
                      <span className="file-symbol"><Icon name="file" /></span>
                      <button className="file-title" type="button" onClick={() => setDialog({ type: 'view', id: m.id })}>{m.title}</button>
                    </div>
                  </td>
                  <td className="optional-column">{nameOf(m.subject)}</td>
                  <td className="optional-column"><span className="badge">{m.type}</span></td>
                  <td className="optional-column">{dateLabel(m.added)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-button" type="button" onClick={() => downloadMaterial(m, nameOf(m.subject))} aria-label={`Prenesi ${m.title}`}><Icon name="down" /></button>
                      <button className="ui-button small" type="button" onClick={() => setDialog({ type: 'delete', id: m.id })}>Izbriši</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="Ni gradiv" copy="Naložite gradivo za enega od svojih predmetov." />}
      {dialog?.type === 'upload' && <MaterialUploadDialog onClose={close} />}
      {dialog?.type === 'delete' && <MaterialDeleteDialog materialId={dialog.id} onClose={close} />}
      {dialog?.type === 'view' && <MaterialDialog materialId={dialog.id} onClose={close} />}
    </>
  )
}
