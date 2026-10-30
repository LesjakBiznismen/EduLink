import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import { notFound } from './http.js'

// Dovoljene vrste gradiv (enako kot v odjemalcu, lib/staff.js).
const KINDS = { pdf: 'PDF', doc: 'Word', docx: 'Word', ppt: 'PowerPoint', pptx: 'PowerPoint', png: 'Slika', jpg: 'Slika', jpeg: 'Slika', gif: 'Slika', webp: 'Slika' }

export const extensionOf = name => (name.includes('.') ? name.split('.').pop() : '').toLowerCase()
export const materialKind = name => KINDS[extensionOf(name)] ?? null

// eslint-disable-next-line no-control-regex
export const safeFilename = value => value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '').slice(0, 150)

// Pot v bazi (npr. /uploads/oddaje/3/22.pdf) pretvori v pot na disku znotraj UPLOAD_DIR.
function diskPath(url) {
  const relative = String(url).replace(/^\/?uploads\//, '')
  const full = path.resolve(config.uploadDir, relative)
  if (!full.startsWith(path.resolve(config.uploadDir) + path.sep)) throw notFound('Datoteka ni na voljo.')
  return full
}

export function saveFile(parts, buffer) {
  const url = `/uploads/${parts.join('/')}`
  const full = diskPath(url)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, buffer)
  return url
}

export function removeFile(url) {
  if (url) fs.rmSync(diskPath(url), { force: true })
}

export function sendFile(res, url, downloadName) {
  const full = url ? diskPath(url) : null
  if (!full || !fs.existsSync(full)) throw notFound('Datoteka ni na voljo na strežniku.')
  res.download(full, downloadName)
}
