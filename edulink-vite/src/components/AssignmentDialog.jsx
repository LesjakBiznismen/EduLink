import { useState } from 'react'
import Dialog from './Dialog.jsx'
import Icon from './Icon.jsx'
import { MAX_FILE_SIZE, dateLabel, download, safeFilename } from '../lib/helpers.js'
import { useApp } from '../context/appContext.js'

// Učenec odda nalogo; datoteka se shrani samo v brskalniku (IndexedDB).
export default function AssignmentDialog({ assignmentId, onClose }) {
  const { assignments, subjects, submissions, saveSubmission, profile, toast } = useApp()
  const assignment = assignments.find(a => a.id === assignmentId)
  const saved = submissions[assignmentId]
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!assignment) return null
  const subject = subjects.find(s => s.id === assignment.subject)

  const onSubmit = async e => {
    e.preventDefault()
    const file = e.currentTarget.elements.file.files[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) { setError('Datoteka je prevelika. Izberite datoteko do 20 MB.'); return }
    if (saved && e.nativeEvent.submitter?.value !== 'yes') { setConfirming(true); return }
    const extension = file.name.includes('.') ? `.${file.name.split('.').pop().replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}` : ''
    const record = {
      id: assignmentId,
      name: `${safeFilename(`${profile.last} ${profile.first} -- ${assignment.title}`)}${extension}`,
      savedAt: new Date().toISOString(),
      blob: file,
    }
    setBusy(true)
    try {
      await saveSubmission(record)
      onClose()
      toast('Oddaja je shranjena v tem brskalniku.')
    } catch {
      setError('Datoteke ni bilo mogoče shraniti. Preverite prostor in dovoljenja brskalnika ter poskusite znova.')
      setBusy(false)
    }
  }

  const onFileChange = () => { setConfirming(false); setError('') }

  return (
    <Dialog title={assignment.title} subtitle={`${subject.name} · Rok oddaje: ${dateLabel(assignment.due)}`} onClose={onClose}>
      <p className="dialog-copy">{assignment.description}</p>
      {saved && (
        <div className="submission-info">
          <Icon name="tick" />
          <div>
            <strong>Oddano</strong><br />{saved.name}<br />
            <span>{new Date(saved.savedAt).toLocaleString('sl-SI')}</span><br />
            <button className="ui-button small quiet" type="button" onClick={() => download(saved.blob, saved.name)}>
              Prenesi svojo oddajo
            </button>
          </div>
        </div>
      )}
      <form onSubmit={onSubmit}>
        <label className="upload-field">
          <Icon name="file" />
          <strong>{saved ? 'Izberite novo datoteko za zamenjavo' : 'Priložite svojo nalogo'}</strong>
          <input type="file" name="file" required aria-describedby="file-help" onChange={onFileChange} />
        </label>
        <p className="note" id="file-help">
          Največ 20 MB. Datoteka se shrani samo v tem brskalniku in je ne prejme učitelj. Ime bo »Priimek Ime -- Naslov naloge.ext«.
        </p>
        <p className="form-error" role="alert">{error}</p>
        {confirming && (
          <div className="inline-confirm">
            <p>Obstoječa oddaja bo zamenjana. Želite nadaljevati?</p>
            <button className="ui-button small" type="button" autoFocus onClick={() => setConfirming(false)}>Ne, ohrani obstoječo</button>{' '}
            <button className="ui-button primary small" type="submit" name="replace" value="yes" disabled={busy}>Da, zamenjaj oddajo</button>
          </div>
        )}
        <div className="profile-footer">
          <span></span>
          {!confirming && (
            <button className="ui-button primary" type="submit" disabled={busy}>
              {saved ? 'Zamenjaj oddajo' : 'Shrani oddajo'}
            </button>
          )}
        </div>
      </form>
    </Dialog>
  )
}
