import Dialog from './Dialog.jsx'
import { fullName } from '../lib/helpers.js'
import { useApp } from '../context/appContext.js'

// Potrditev izbrisa predmeta, učitelja ali učenca (kind: subjects | teachers | students).
export default function DeleteDialog({ kind, id, onClose }) {
  const { store, updateStore, toast } = useApp()
  const item = store[kind].find(x => x.id === id)
  if (!item) return null
  const name = kind === 'subjects' ? item.name : fullName(item)

  const remove = () => {
    updateStore(s => {
      if (kind === 'subjects') {
        s.subjects = s.subjects.filter(x => x.id !== id)
        ;[...s.teachers, ...s.students].forEach(p => { p.subjects = p.subjects.filter(x => x !== id) })
      } else s[kind] = s[kind].filter(x => x.id !== id)
    })
    onClose()
    toast('Izbrisano.')
  }

  return (
    <Dialog
      title="Izbris"
      onClose={onClose}
      actions={(
        <>
          <button className="ui-button" type="button" onClick={onClose}>Prekliči</button>
          <button className="ui-button primary" type="button" onClick={remove}>Izbriši</button>
        </>
      )}
    >
      <p className="dialog-copy">
        Želite izbrisati »{name}«?{kind === 'subjects' ? ' Predmet bo odstranjen tudi pri učiteljih in učencih.' : ''} Tega ni mogoče razveljaviti.
      </p>
    </Dialog>
  )
}
