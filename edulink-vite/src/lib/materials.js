import { download, safeFilename } from './helpers.js'
import { fileBlob } from './storage.js'

// Gradivo, ki ga je naložil učitelj, se prenese kot prava datoteka; vzorčna gradiva kot besedilo.
export async function downloadMaterial(material, subjectName) {
  if (material.fileName) {
    const blob = await fileBlob(material.id)
    if (blob) { download(blob, material.fileName); return }
  }
  const text = `${material.title}\n${subjectName}\n\n${material.content}\n\nEduLink — vzorčno gradivo`
  download(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${safeFilename(material.title)}.txt`)
}
