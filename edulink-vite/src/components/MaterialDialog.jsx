import Dialog from './Dialog.jsx'
import Icon from './Icon.jsx'
import { downloadMaterial } from '../lib/materials.js'
import { useApp } from '../context/appContext.js'

export default function MaterialDialog({ materialId, onClose }) {
  const { materials, subjects } = useApp()
  const material = materials.find(m => m.id === materialId)
  if (!material) return null
  const subjectName = subjects.find(s => s.id === material.subject)?.name || ''
  return (
    <Dialog
      title={material.title}
      subtitle={`${subjectName} · ${material.type}`}
      onClose={onClose}
      actions={(
        <>
          <button className="ui-button" type="button" onClick={onClose}>Zapri</button>
          <button className="ui-button primary" type="button" onClick={() => downloadMaterial(material, subjectName)}>
            <Icon name="down" /> Prenesi gradivo
          </button>
        </>
      )}
    >
      <div className="material-content">{material.content}</div>
    </Dialog>
  )
}
