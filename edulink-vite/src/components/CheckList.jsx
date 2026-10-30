// Seznam potrditvenih polj; izbrane vrednosti se preberejo z FormData.getAll('rel').
export default function CheckList({ items, checkedIds }) {
  return (
    <div className="check-grid">
      {items.map(i => (
        <label className="selection-option" key={i.id}>
          <span>{i.label}</span>
          <input type="checkbox" name="rel" value={i.id} defaultChecked={checkedIds.includes(i.id)} />
        </label>
      ))}
    </div>
  )
}
