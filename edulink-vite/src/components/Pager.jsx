import { PER_PAGE } from '../lib/staff.js'

export default function Pager({ pg, onPage }) {
  if (pg.total <= PER_PAGE) return null
  return (
    <div className="pager">
      <span>{(pg.page - 1) * PER_PAGE + 1}–{Math.min(pg.page * PER_PAGE, pg.total)} od {pg.total}</span>
      <div className="row-actions">
        <button className="ui-button small" type="button" disabled={pg.page <= 1} onClick={() => onPage(pg.page - 1)}>Prejšnja</button>
        <button className="ui-button small" type="button" disabled={pg.page >= pg.pages} onClick={() => onPage(pg.page + 1)}>Naslednja</button>
      </div>
    </div>
  )
}
