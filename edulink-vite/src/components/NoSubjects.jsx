import EmptyState from './EmptyState.jsx'
import { useApp } from '../context/appContext.js'

export default function NoSubjects() {
  const { setChooserOpen } = useApp()
  return (
    <EmptyState title="Najprej izberite predmete" copy="Naloge in gradiva se prikažejo za predmete v vaši učilnici.">
      <button className="ui-button primary" type="button" onClick={() => setChooserOpen(true)}>Izberi predmete</button>
    </EmptyState>
  )
}
