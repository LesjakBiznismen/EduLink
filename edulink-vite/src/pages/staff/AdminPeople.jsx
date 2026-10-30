import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CheckList from '../../components/CheckList.jsx'
import DeleteDialog from '../../components/DeleteDialog.jsx'
import Dialog from '../../components/Dialog.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import Icon from '../../components/Icon.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Pager from '../../components/Pager.jsx'
import { api } from '../../lib/api.js'
import { fullName, initials, normalize } from '../../lib/helpers.js'
import { paginate, subjectNames } from '../../lib/staff.js'
import { useApp } from '../../context/appContext.js'

const kindInfo = {
  teachers: { role: 'ucitelj', title: 'Učitelji', add: 'Dodaj učitelja', search: 'Poišči učitelja', one: 'učitelja', min: 1, minText: 'Izberite vsaj en predmet.', legend: 'Predmeti, ki jih poučuje' },
  students: { role: 'ucenec', title: 'Učenci', add: 'Dodaj učenca', search: 'Poišči učenca', one: 'učenca', min: 2, minText: 'Učenec mora obiskovati vsaj dva predmeta.', legend: 'Predmeti, ki jih obiskuje' },
}

function PersonDialog({ kind, person, onSaved, onClose }) {
  const { subjects, toast } = useApp()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const info = kindInfo[kind]

  const onSubmit = async e => {
    e.preventDefault()
    const values = new FormData(e.currentTarget)
    const body = {
      role: info.role,
      first: String(values.get('first')).trim(),
      last: String(values.get('last')).trim(),
      email: String(values.get('email')).trim(),
      username: String(values.get('username') || '').trim(),
      password: String(values.get('password') || ''),
      subjects: values.getAll('rel'),
    }
    if (!body.first || !body.last) { setError('Vnesite ime in priimek.'); return }
    if (body.subjects.length < info.min) { setError(info.minText); return }
    if (person && !body.password) delete body.password
    setBusy(true)
    try {
      if (person) await api.put(`/users/${person.id}`, body)
      else await api.post('/users', body)
      await onSaved()
      onClose()
      toast('Shranjeno.')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Dialog
      title={person ? `Uredi ${info.one}` : info.add}
      onClose={onClose}
      actions={(
        <>
          <button className="ui-button" type="button" onClick={onClose}>Prekliči</button>
          <button className="ui-button primary" type="submit" form="person-form" disabled={busy}>Shrani</button>
        </>
      )}
    >
      <form id="person-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="profile-fields">
            <label className="field">Ime<input name="first" required maxLength={60} defaultValue={person?.first || ''} /></label>
            <label className="field">Priimek<input name="last" required maxLength={60} defaultValue={person?.last || ''} /></label>
          </div>
          <label className="field">E-naslov<input name="email" type="email" required maxLength={120} defaultValue={person?.email || ''} /></label>
          <div className="profile-fields">
            {person
              ? <div className="field">Uporabniško ime<span className="field-value">{person.username}</span></div>
              : <label className="field">Uporabniško ime<input name="username" maxLength={50} placeholder="Samodejno: ime.priimek" /></label>}
            <label className="field">
              {person ? 'Novo geslo (neobvezno)' : 'Začetno geslo'}
              <input name="password" type="password" minLength={8} required={!person} autoComplete="new-password" />
            </label>
          </div>
          <fieldset className="field-set">
            <legend>{info.legend}</legend>
            <CheckList items={subjects.map(s => ({ id: s.id, label: s.name }))} checkedIds={person?.subjects || []} />
          </fieldset>
          <p className="form-error" role="alert">{error}</p>
        </div>
      </form>
    </Dialog>
  )
}

// Administrator: seznam učiteljev ali učencev z iskanjem, straničenjem, urejanjem in brisanjem.
export default function AdminPeople({ kind }) {
  const { subjects, reloadSubjects, toast } = useApp()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [page, setPage] = useState(1)
  const [people, setPeople] = useState(null)
  const [editing, setEditing] = useState(null) // null | '' (nov) | id osebe
  const [deleting, setDeleting] = useState(null)
  const info = kindInfo[kind]

  // Ob spremembi oseb se spremenijo tudi učitelji in število učencev pri predmetih.
  const reload = useCallback(async () => {
    setPeople(await api.get(`/users?role=${info.role}`))
    await reloadSubjects()
  }, [info.role, reloadSubjects])

  useEffect(() => {
    api.get(`/users?role=${info.role}`).then(setPeople).catch(err => toast(err.message))
  }, [info.role, toast])

  if (!people) return <><PageHeader title={info.title} /><p className="note">Nalaganje …</p></>

  const q = normalize(query)
  const items = people.filter(p => normalize(`${fullName(p)} ${p.email} ${p.username}`).includes(q))
  const pg = paginate(items, page)
  const toDelete = people.find(p => p.id === deleting)

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
                    <td className="optional-column">{subjectNames(subjects, p.subjects)}</td>
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
      {editing !== null && (
        <PersonDialog kind={kind} person={people.find(p => p.id === editing)} onSaved={reload} onClose={() => setEditing(null)} />
      )}
      {toDelete && (
        <DeleteDialog
          name={fullName(toDelete)}
          onConfirm={async () => { await api.delete(`/users/${toDelete.id}`); await reload() }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}
