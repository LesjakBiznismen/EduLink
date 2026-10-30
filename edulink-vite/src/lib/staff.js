import { downloadFile } from './api.js'

export const PER_PAGE = 20

export const subjectNames = (subjects, ids) => ids.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(', ')

export function paginate(items, page) {
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE))
  const current = Math.min(Math.max(1, page), pages)
  return { slice: items.slice((current - 1) * PER_PAGE, current * PER_PAGE), pages, total: items.length, page: current }
}

// Prenos oddaje učenca s strežnika.
export const downloadSubmission = submission => downloadFile(`/submissions/${submission.id}/file`, submission.name)

// Dovoljene so samo predstavitve, dokumenti in slike v osnovnih formatih.
export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'gif', 'webp']
export const ACCEPT = ALLOWED_EXTENSIONS.map(e => `.${e}`).join(',')
export const extensionOf = name => (name.includes('.') ? name.split('.').pop() : '').toLowerCase()
