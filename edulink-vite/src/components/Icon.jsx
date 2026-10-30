const paths = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  check: 'M9 4H5a2 2 0 0 0-2 2v14h18V6a2 2 0 0 0-2-2h-4 M9 2h6v5H9z M8 14l3 3 5-6',
  tick: 'M5 12.5l4.5 4.5L19 7',
  folder: 'M3 6h7l2 2h9v12H3z M3 6V4h7l2 2h7v2',
  calendar: 'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4 M8 14h2 M14 14h2',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-3a8 8 0 0 1 16 0v3',
  search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6',
  plus: 'M12 5v14 M5 12h14',
  close: 'M6 6l12 12 M18 6 6 18',
  arrow: 'M5 12h14 M14 7l5 5-5 5',
  down: 'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
  file: 'M5 3h9l5 5v13H5z M14 3v6h5 M9 13h6 M9 17h6',
  logout: 'M10 4H4v16h6 M9 12h12 M17 8l4 4-4 4',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  warn: 'M12 4l10 17H2z M12 10v5 M12 18v.5',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6',
  users: 'M9 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z M2 20v-2a6 6 0 0 1 12 0v2 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14a6 6 0 0 1 4 6',
}

export default function Icon({ name }) {
  return (
    <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] || paths.file} />
    </svg>
  )
}
