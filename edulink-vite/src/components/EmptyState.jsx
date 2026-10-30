import Icon from './Icon.jsx'

export default function EmptyState({ title, copy, children }) {
  return (
    <div className="empty-state">
      <Icon name="folder" />
      <h2>{title}</h2>
      <p>{copy}</p>
      {children}
    </div>
  )
}
