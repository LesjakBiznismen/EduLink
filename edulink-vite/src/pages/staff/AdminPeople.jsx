import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CheckList from '../../components/CheckList.jsx'
import DeleteDialog from '../../components/DeleteDialog.jsx'
import Dialog from '../../components/Dialog.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import Icon from '../../components/Icon.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Pager from '../../components/Pager.jsx'
import { fullName, initials, normalize } from '../../lib/helpers.js'
import { paginate, subjectNames } from '../../lib/staff.js'
import { useApp } from '../../context/appContext.js'

const kindInfo = {
  teachers: { title: 'Učitelji', add: 'Dodaj učitelja', search: 'Poišči učitelja', one: 'učitelja', min: 1, minText: 'Izberite vsaj en predmet.', prefix: 't', legend: 'Predmeti, ki jih poučuje' },
  students: { title: 'Učenci', add: 'Dodaj učenca', search: 'Poišči učenca', one: 'učenca', min: 2, minText: 'Učenec mora obiskovati vsaj dva predmeta.', prefix: 's', legend: 'Predmeti, ki jih obiskuje' },
}

function PersonDialog({ kind, personId, onClose }) {
  const { store, updateStore, toast } = useApp()
  const [error, setError] = useState('')
  const info = kindInfo[kind]
  const person = personId ? store[kind].find(x => x.id === personId) : null

  const onSubmit = e => {
    e.preventDefault()
    const values = new FormData(e.currentTarget)
    const first = String(values.get('first')).trim()
    const last = String(values.get('last')).trim()
    const email = String(values.get('email')).trim()
    const subjects = values.getAll('rel')
    if (!first || !last) { setError('Vnesite ime in priimek.'); return }
    if (subjects.length < info.min) { setError(info.minText); return }
    updateStore(s => {
      if (personId) Object.assign(s[kind].find(x => x.id === personId), { first, last, email, subjects })
      else {
        let n = s[kind].length + 1
        while (s[kind].some(x => x.id === `${info.prefix}${n}`)) n++
        s[kind].push({ id: `${info.prefix}${n}`, first, last, email, subjects })
      }
    })
    onClose()
    toast('Shranjeno.')
  }

  return (
    <Dialog
      title={person ? `Uredi ${info.one}` : info.add}
      onClose={onClose}
      actions={(
        <>
          <button className="ui-button" type="button" onClick={onClose}>Prekliči</button>
          <button className="ui-button primary" type="submit" form="person-form">Shrani</button>
        </>
      )}
    >
      <form id="person-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="profile-fields">
            <label className="field">Ime<input name="first" required maxLength={60} defaultValue={person?.first || ''} /></label>
            <label className="field">Priimek<input name="last" required maxLength={60} defaultValue={person?.last || ''} /></label>
          </div>
          <label className="field">E-naslov<input name="email" type="email" maxLength={120} defaultValue={person?.email || ''} /></label>
          <fieldset className="field-set">
            <legend>{info.legend}</legend>
            <CheckList items={store.subjects.map(s => ({ id: s.id, label: s.name }))} checkedIds={person?.subjects || []} />
          </fieldset>
          <p className="form-error" role="alert">{error}</p>
        </div>
      </form>
    </Dialog>
  )
}

// Administrator: seznam učiteljev ali učencev z iskanjem, straničenjem, urejanjem in brisanjem.
export default function AdminPeople({ kind }) {
  const { store } = useApp()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null) // null | '' (nov) | id osebe
  const [deleting, setDeleting] = useState(null)
  const info = kindInfo[kind]

  const q = normalize(query)
  const items = store[kind].filter(p => normalize(`${fullName(p)} ${p.email}`).includes(q))
  const pg = paginate(items, page)

  return (
    <>
      <PageHeader title={info.title}>
        <button className="ui-button primary" type="button" onClick={() => setEditing('')}><Icon name="plus" /> {info.add}</button>
      </PageHeader>
      <div className="toolbar">
        <label className="search-field">
          <Icon name="search" />
          <input type="search" aria-label={info.search} placeholder={info.search} value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} />
        </label>
      </div>
      {items.length ? (
        <>
          <div className="list-surface">
            <table className="file-table">
              <thead>
                <tr>
                  <th scope="col">Ime in priimek</th>
                  <th className="optional-column" scope="col">E-naslov</th>
                  <th className="optional-column" scope="col">Predmeti</th>
                  <th scope="col"><span className="sr-only">Dejanja</span></th>
                </tr>
              </thead>
              <tbody>
                {pg.slice.map(p => (
                  <tr key={p.id}>
                    <td><div className="file-name"><span className="avatar" aria-hidden="true">{initials(p)}</span><strong>{fullName(p)}</strong></div></td>
                    <td className="optional-column">{p.email}</td>
                    <td className="optional-column">{subjectNames(store.subjects, p.subjects)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="ui-button small" type="button" onClick={() => setEditing(p.id)}>Uredi</button>
                        <button className="ui-button small" type="button" onClick={() => setDeleting(p.id)}>Izbriši</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager pg={pg} onPage={setPage} />
        </>
      ) : <EmptyState title="Ni zadetkov" copy="Poskusite drug iskalni izraz." />}
      {editing !== null && <PersonDialog kind={kind} personId={editing} onClose={() => setEditing(null)} />}
      {deleting && <DeleteDialog kind={kind} id={deleting} onClose={() => setDeleting(null)} />}
    </>
  )
}
