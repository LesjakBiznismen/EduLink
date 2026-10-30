import { dateTime, download, fullName, hash, safeFilename } from './helpers.js'

export const PER_PAGE = 20

export const subjectNames = (subjects, ids) => ids.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(', ')

export function paginate(items, page) {
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE))
  const current = Math.min(Math.max(1, page), pages)
  return { slice: items.slice((current - 1) * PER_PAGE, current * PER_PAGE), pages, total: items.length, page: current }
}

// Oddaje za nalogo: učenci iz vzorčnih podatkov (naključno oddani) in dejanska oddaja prijavljenega demo učenca.
export function submissionsFor(assignment, { students, submissions, profile }) {
  const rows = students.filter(s => s.subjects.includes(assignment.subject)).map(s => {
    const h = hash(s.id + assignment.id)
    const d = new Date(`${assignment.due}T12:00:00`)
    d.setDate(d.getDate() - 1 - (h % 4))
    d.setHours(8 + (h % 10), (h % 6) * 10)
    return { key: `${s.id}|${assignment.id}`, who: fullName(s), submitted: h % 10 < 6, savedAt: d.toISOString(), name: `${s.last} ${s.first} -- ${assignment.title}`, assignment }
  })
  const real = submissions[assignment.id]
  if (real) rows.unshift({ key: `demo|${assignment.id}`, who: `${fullName(profile)} (demo učenec)`, submitted: true, savedAt: real.savedAt, name: real.name, blob: real.blob, assignment })
  return rows.sort((x, y) => Number(y.submitted) - Number(x.submitted) || y.savedAt.localeCompare(x.savedAt))
}

export function downloadSubmission(row) {
  const blob = row.blob || new Blob(
    [`Oddaja učenca: ${row.who}\nNaloga: ${row.assignment.title}\nOddano: ${dateTime(row.savedAt)}\n\nVzorčna oddaja za predstavitev.`],
    { type: 'text/plain;charset=utf-8' },
  )
  download(blob, `${safeFilename(row.name)}${row.blob ? '' : '.txt'}`)
}

// Dovoljene so samo predstavitve, dokumenti in slike v osnovnih formatih.
export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'gif', 'webp']
export const ACCEPT = ALLOWED_EXTENSIONS.map(e => `.${e}`).join(',')
export const extensionOf = name => (name.includes('.') ? name.split('.').pop() : '').toLowerCase()
export const fileKind = ext => (ext === 'pdf' ? 'PDF' : ['doc', 'docx'].includes(ext) ? 'Word' : ['ppt', 'pptx'].includes(ext) ? 'PowerPoint' : 'Slika')
