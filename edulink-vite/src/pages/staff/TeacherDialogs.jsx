import { useState } from 'react'
import Dialog from '../../components/Dialog.jsx'
import Icon from '../../components/Icon.jsx'
import { MAX_FILE_SIZE, localIso } from '../../lib/helpers.js'
import { ACCEPT, ALLOWED_EXTENSIONS, extensionOf, fileKind } from '../../lib/staff.js'
import { filesTx } from '../../lib/storage.js'
import { useApp } from '../../context/appContext.js'

// Učitelj naloži gradivo; datoteka gre v IndexedDB, podatki o gradivu v localStorage.
export function MaterialUploadDialog({ subjectId, onClose }) {
  const { mySubjects, teacher, updateStore, toast } = useApp()
  const [error, setError] = useState('')

  const onSubmit = async e => {
    e.preventDefault()
    const values = new FormData(e.currentTarget)
    const file = values.get('file')
    if (!file?.size && !file?.name) { setError('Izberite datoteko.'); return }
    const ext = extensionOf(file.name)
    if (!ALLOWED_EXTENSIONS.includes(ext)) { setError('Dovoljene so samo datoteke PDF, Word (doc, docx), PowerPoint (ppt, pptx) in slike (png, jpg, gif, webp).'); return }
    if (file.size > MAX_FILE_SIZE) { setError('Datoteka je prevelika. Izberite datoteko do 20 MB.'); return }
    const id = `m-${Date.now()}`
    try {
      await filesTx('readwrite', s => s.put(file, id))
    } catch {
      setError('Datoteke ni bilo mogoče shraniti. Preverite prostor in dovoljenja brskalnika.')
      return
    }
    const material = {
      id,
      subject: values.get('subject'),
      title: String(values.get('title')).trim() || file.name.replace(/\.[^.]+$/, ''),
      type: values.get('type'),
      content: `Priložena datoteka: ${file.name} (${fileKind(ext)}, ${Math.max(1, Math.round(file.size / 1024))} kB).`,
      added: localIso(),
      by: teacher.id,
      fileName: file.name,
    }
    updateStore(s => { s.materials.push(material) })
    onClose()
    toast('Gradivo je naloženo.')
  }

  return (
    <Dialog
      title="Naloži gradivo"
      subtitle="Gradivo bo takoj vidno učencem."
      onClose={onClose}
      actions={(
        <>
          <button className="ui-button" type="button" onClick={onClose}>Prekliči</button>
          <button className="ui-button primary" type="submit" form="material-form">Naloži</button>
        </>
      )}
    >
      <form id="material-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="field">
            Predmet
            <select name="subject" required defaultValue={subjectId || mySubjects[0]?.id}>
              {mySubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="field">Vrsta<select name="type"><option>Zapiski</option><option>Vaje</option></select></label>
          <label className="field">Naslov (neobvezno)<input name="title" maxLength={120} placeholder="Če ostane prazno, se uporabi ime datoteke" /></label>
          <label className="upload-field">
            <Icon name="file" />
            <strong>Izberite datoteko</strong>
            <input type="file" name="file" accept={ACCEPT} required onChange={() => setError('')} />
          </label>
          <p className="note">Dovoljeni formati: PDF, Word (doc, docx), PowerPoint (ppt, pptx) in slike (png, jpg, gif, webp). Največ 20 MB.</p>
          <p className="form-error" role="alert">{error}</p>
        </div>
      </form>
    </Dialog>
  )
}

export function AssignmentCreateDialog({ subjectId, onClose }) {
  const { subjects, updateStore, toast } = useApp()
  const [error, setError] = useState('')
  const [defaultDue] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return localIso(d)
  })

  const onSubmit = e => {
    e.preventDefault()
    const values = new FormData(e.currentTarget)
    const title = String(values.get('title')).trim()
    const due = String(values.get('due'))
    if (!title) { setError('Vnesite naslov naloge.'); return }
    if (!due) { setError('Izberite rok oddaje.'); return }
    const assignment = {
      id: `a-${Date.now()}`,
      subject: subjectId,
      title,
      description: String(values.get('description')).trim() || 'Navodila za nalogo bo dodal učitelj.',
      due,
    }
    updateStore(s => { s.assignments.push(assignment) })
    onClose()
    toast('Naloga je dodana.')
  }

  return (
    <Dialog
      title="Nova naloga"
      subtitle={subjects.find(s => s.id === subjectId)?.name || ''}
      onClose={onClose}
      actions={(
        <>
          <button className="ui-button" type="button" onClick={onClose}>Prekliči</button>
          <button className="ui-button primary" type="submit" form="assignment-form">Dodaj nalogo</button>
        </>
      )}
    >
      <form id="assignment-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="field">Naslov<input name="title" required maxLength={120} /></label>
          <label className="field">Navodila<textarea name="description" rows={4} maxLength={1000}></textarea></label>
          <label className="field">Rok oddaje<input name="due" type="date" required defaultValue={defaultDue} min={localIso()} /></label>
          <p className="form-error" role="alert">{error}</p>
        </div>
      </form>
    </Dialog>
  )
}

export function MaterialDeleteDialog({ materialId, onClose }) {
  const { materials, updateStore, toast } = useApp()
  const material = materials.find(m => m.id === materialId)
  if (!material) return null

  const remove = () => {
    filesTx('readwrite', s => s.delete(materialId)).catch(() => {})
    updateStore(s => {
      if (s.materials.some(m => m.id === materialId)) s.materials = s.materials.filter(m => m.id !== materialId)
      else if (!s.removedMaterials.includes(materialId)) s.removedMaterials.push(materialId)
    })
    onClose()
    toast('Gradivo je izbrisano.')
  }

  return (
    <Dialog
      title="Izbris gradiva"
      onClose={onClose}
      actions={(
        <>
          <button className="ui-button" type="button" onClick={onClose}>Prekliči</button>
          <button className="ui-button primary" type="button" onClick={remove}>Izbriši</button>
        </>
      )}
    >
      <p className="dialog-copy">Želite izbrisati gradivo »{material.title}«? Učenci ga ne bodo več videli.</p>
    </Dialog>
  )
}
