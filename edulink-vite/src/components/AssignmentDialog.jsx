import { useState } from 'react'
import Dialog from './Dialog.jsx'
import Icon from './Icon.jsx'
import { downloadFile } from '../lib/api.js'
import { MAX_FILE_SIZE, dateLabel } from '../lib/helpers.js'
import { useApp } from '../context/appContext.js'

// Učenec odda nalogo; datoteka se naloži na strežnik, kjer jo vidi učitelj.
export default function AssignmentDialog({ assignmentId, onClose }) {
  const { assignments, subjects, submissions, saveSubmission, toast } = useApp()
  const assignment = assignments.find(a => a.id === assignmentId)
  const saved = submissions[assignmentId]
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [serverHasSubmission, setServerHasSubmission] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!assignment) return null
  const subject = subjects.find(s => s.id === assignment.subject)

  const onSubmit = async e => {
    e.preventDefault()
    const file = e.currentTarget.elements.file.files[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) { setError('Datoteka je prevelika. Izberite datoteko do 20 MB.'); return }
    const replacing = Boolean(saved) || serverHasSubmission
    if (replacing && e.nativeEvent.submitter?.value !== 'yes') { setConfirming(true); return }
    setBusy(true)
    try {
      // Do tu pridemo z zamenjavo samo, če je učenec v potrditvenem koraku izbral »Da«.
      await saveSubmission(assignmentId, file, replacing)
      onClose()
      toast('Naloga je oddana.')
    } catch (err) {
      // Oddaja je medtem nastala drugje (npr. v drugem zavihku): pokažemo potrditev zamenjave.
      if (err.code === 'EXISTS') { setServerHasSubmission(true); setConfirming(true) }
      else setError(err.message)
      setBusy(false)
    }
  }

  const onDownload = () => downloadFile(`/submissions/${saved.id}/file`, saved.name).catch(err => toast(err.message))
  const onFileChange = () => { setConfirming(false); setError('') }

  return (
    <Dialog title={assignment.title} subtitle={`${subject?.name || ''} · Rok oddaje: ${dateLabel(assignment.due)}`} onClose={onClose}>
      <p className="dialog-copy">{assignment.description}</p>
      {saved && (
        <div className="submission-info">
          <Icon name="tick" />
          <div>
            <strong>Oddano</strong><br />{saved.name}<br />
            <span>{new Date(saved.savedAt).toLocaleString('sl-SI')}</span><br />
            {saved.grade && (
              <p className="grade-line"><strong>Ocena: {saved.grade}</strong>{saved.feedback ? ` · ${saved.feedback}` : ''}</p>
            )}
            <button className="ui-button small quiet" type="button" onClick={onDownload}>
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
          Največ 20 MB. Datoteka se shrani na strežnik in jo prejme učitelj. Ime bo »Priimek Ime – Naslov naloge.ext«.
        </p>
        <p className="form-error" role="alert">{error}</p>
        {confirming && (
          <div className="inline-confirm">
            <p>Obstoječa oddaja bo zamenjana{saved?.grade ? ', ocena pa odstranjena' : ''}. Želite nadaljevati?</p>
            <button className="ui-button small" type="button" autoFocus onClick={() => setConfirming(false)}>Ne, ohrani obstoječo</button>{' '}
            <button className="ui-button primary small" type="submit" name="replace" value="yes" disabled={busy}>Da, zamenjaj oddajo</button>
          </div>
        )}
        <div className="profile-footer">
          <span></span>
          {!confirming && (
            <button className="ui-button primary" type="submit" disabled={busy}>
              {busy ? 'Nalaganje …' : saved ? 'Zamenjaj oddajo' : 'Oddaj nalogo'}
            </button>
          )}
        </div>
      </form>
    </Dialog>
  )
}
