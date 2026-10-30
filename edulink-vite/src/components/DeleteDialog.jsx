import { useState } from 'react'
import Dialog from './Dialog.jsx'
import { useApp } from '../context/appContext.js'

// Potrditev izbrisa predmeta, učitelja ali učenca; onConfirm izvede izbris na strežniku.
export default function DeleteDialog({ name, note = '', onConfirm, onClose }) {
  const { toast } = useApp()
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
      toast('Izbrisano.')
    } catch (err) {
      toast(err.message)
      setBusy(false)
    }
  }

  return (
    <Dialog
      title="Izbris"
      onClose={onClose}
      actions={(
        <>
          <button className="ui-button" type="button" onClick={onClose}>Prekliči</button>
          <button className="ui-button primary" type="button" onClick={remove} disabled={busy}>Izbriši</button>
        </>
      )}
    >
      <p className="dialog-copy">Želite izbrisati »{name}«?{note} Tega ni mogoče razveljaviti.</p>
    </Dialog>
  )
}
