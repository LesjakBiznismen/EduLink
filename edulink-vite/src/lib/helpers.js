export const slug = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '')

export const dateValue = iso => new Date(`${iso}T12:00:00`)
export const dateLabel = iso => dateValue(iso).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short' })
export const dateTime = iso => new Date(iso).toLocaleString('sl-SI', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export const localIso = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const fullName = p => `${p.first} ${p.last}`
export const initials = p => `${p.first?.[0] || ''}${p.last?.[0] || ''}`.toUpperCase()
export const imgSrc = s => `/slike/predmeti/${s.image}${s.image.includes('.') ? '' : '.png'}`

export const plural = (n, one, two, few, many) => `${n} ${n % 100 === 1 ? one : n % 100 === 2 ? two : [3, 4].includes(n % 100) ? few : many}`

// eslint-disable-next-line no-control-regex
export const safeFilename = value => value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '').slice(0, 150)

export const normalize = text => text.toLocaleLowerCase('sl')

export function download(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const MAX_FILE_SIZE = 20 * 1024 * 1024
