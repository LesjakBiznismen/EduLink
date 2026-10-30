import { useEffect, useRef } from 'react'
import Icon from './Icon.jsx'

// Modalno okno (<dialog>): zapre se z Esc, s klikom izven okna ali z gumbom.
export default function Dialog({ title, subtitle, onClose, actions, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    const trigger = document.activeElement
    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
      if (trigger?.isConnected) trigger.focus()
    }
  }, [])

  // StrictMode zapre in znova odpre okno; zakasnjen "close" dogodek ob odprtem oknu ignoriramo.
  const onNativeClose = () => { if (!ref.current?.open) onClose() }

  const onBackdropClick = e => {
    if (e.target !== e.currentTarget) return
    const r = e.currentTarget.getBoundingClientRect()
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose()
  }

  return (
    <dialog ref={ref} className="app-dialog" aria-labelledby="dialog-title" onClose={onNativeClose} onClick={onBackdropClick}>
      <div className="dialog-head">
        <div>
          <h2 id="dialog-title">{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Zapri" title="Zapri">
          <Icon name="close" />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
      {actions && <div className="dialog-actions">{actions}</div>}
    </dialog>
  )
}
