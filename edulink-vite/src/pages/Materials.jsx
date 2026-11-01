import { useState } from 'react'
import EmptyState from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import MaterialDialog from '../components/MaterialDialog.jsx'
import NoSubjects from '../components/NoSubjects.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { normalize } from '../lib/helpers.js'
import { useApp } from '../context/appContext.js'

// Učenec: gradiva izbranih predmetov.
export default function Materials() {
  const { studentSubjects, subjects, materials, selected, downloadMaterial } = useApp()
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('')
  const [type, setType] = useState('')
  const [openId, setOpenId] = useState(null)

  if (!selected.length) return <><PageHeader title="Gradiva" /><NoSubjects /></>

  const nameOf = id => subjects.find(s => s.id === id)?.name || ''
  const q = normalize(query)
  const items = materials.filter(m => (
    selected.includes(m.subject) && (!subject || m.subject === subject) && (!type || m.type === type)
    && normalize(`${m.title} ${nameOf(m.subject)}`).includes(q)
  ))

  return (
    <>
      <PageHeader title="Gradiva" />
      <div className="toolbar">
        <label className="search-field">
          <Icon name="search" />
          <input type="search" aria-label="Poišči gradivo" placeholder="Poišči gradivo" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <div className="filters">
          <select aria-label="Filtriraj po predmetu" value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">Vsi predmeti</option>
            {studentSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select aria-label="Vrsta gradiva" value={type} onChange={e => setType(e.target.value)}>
            <option value="">Vse vrste</option>
            {['Zapiski', 'Vaje'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      {items.length ? (
        <div className="list-surface">
          <table className="file-table">
            <thead>
              <tr>
                <th scope="col">Ime gradiva</th>
                <th className="optional-column" scope="col">Vrsta</th>
                <th scope="col"><span className="sr-only">Prenos</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map(m => (
                <tr key={m.id}>
                  <td>
                    <div className="file-name">
                      <span className="file-symbol"><Icon name="file" /></span>
                      <div>
                        <button className="file-title" type="button" onClick={() => setOpenId(m.id)}>{m.title}</button>
                        <span className="file-subject">{nameOf(m.subject)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="optional-column"><span className="badge">{m.type}</span></td>
                  <td>
                    <button className="icon-button" type="button" onClick={() => downloadMaterial(m, nameOf(m.subject))} aria-label={`Prenesi ${m.title}`}>
                      <Icon name="down" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Ni najdenih gradiv" copy="Poskusite drug iskalni izraz ali odstranite filtre.">
          <button className="ui-button small" type="button" onClick={() => { setQuery(''); setSubject(''); setType('') }}>Počisti filtre</button>
        </EmptyState>
      )}
      {openId && <MaterialDialog materialId={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
