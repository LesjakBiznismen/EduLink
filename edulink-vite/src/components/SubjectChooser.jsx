import { useState } from 'react'
import Dialog from './Dialog.jsx'
import { imgSrc } from '../lib/helpers.js'
import { useApp } from '../context/appContext.js'

// Učenec izbere predmete, ki jih obiskuje.
export default function SubjectChooser({ onClose }) {
  const { subjects, selected, saveSelection } = useApp()
  const [chosen, setChosen] = useState(selected)
  const [error, setError] = useState('')

  const toggle = id => setChosen(current => (current.includes(id) ? current.filter(x => x !== id) : [...current, id]))
  const save = () => {
    if (!chosen.length) { setError('Izberite vsaj en predmet.'); return }
    if (saveSelection(chosen)) onClose()
  }

  return (
    <Dialog
      title="Izberite predmete"
      subtitle="Označite predmete, ki jih želite imeti na seznamu."
      onClose={onClose}
      actions={(
        <>
          <button className="ui-button" type="button" onClick={onClose}>Prekliči</button>
          <button className="ui-button primary" type="button" onClick={save}>Shrani izbor</button>
        </>
      )}
    >
      <div className="selection-list">
        {subjects.map(s => (
          <label className="selection-option" key={s.id}>
            <img src={imgSrc(s)} alt="" />
            <span>{s.name}</span>
            <input type="checkbox" checked={chosen.includes(s.id)} onChange={() => { toggle(s.id); setError('') }} />
          </label>
        ))}
      </div>
      <p className="form-error" role="alert">{error}</p>
    </Dialog>
  )
}
