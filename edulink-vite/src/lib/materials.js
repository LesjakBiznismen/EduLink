import { downloadFile } from './api.js'
import { download, safeFilename } from './helpers.js'

// Gradivo z datoteko se prenese s strežnika; besedilno gradivo kot datoteka .txt.
export async function downloadMaterial(material, subjectName) {
  if (material.fileName) {
    await downloadFile(`/materials/${material.id}/file`, material.fileName)
    return
  }
  const text = `${material.title}\n${subjectName}\n\n${material.content}\n\nEduLink`
  download(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${safeFilename(material.title)}.txt`)
}
