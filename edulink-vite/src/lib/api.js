import { download } from './helpers.js'

// Odjemalec za strežnik EduLink (backend/). Žeton seje se hrani v sessionStorage.
const TOKEN_KEY = 'edulink-token'

export const getToken = () => {
  try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null }
}
export const setToken = token => {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch { /* Brez shrambe seja velja do osvežitve strani. */ }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

let onUnauthorized = () => {}
export const setUnauthorizedHandler = fn => { onUnauthorized = fn }

async function request(path, { method = 'GET', body, form, raw = false } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  let res
  try {
    res = await fetch(`/api${path}`, { method, headers, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined) })
  } catch {
    throw new ApiError(0, 'Strežnik ni dosegljiv. Preverite, ali backend teče.')
  }
  if (res.status === 401 && token) onUnauthorized()
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new ApiError(res.status, data?.error || `Zahteva ni uspela (${res.status}).`)
  }
  if (raw) return res
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get: path => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: path => request(path, { method: 'DELETE' }),
  upload: (path, form) => request(path, { method: 'POST', form }),
}

// Prenese datoteko z avtorizacijo (gradivo ali oddajo) in jo shrani pod danim imenom.
export async function downloadFile(path, name) {
  const res = await request(path, { raw: true })
  download(await res.blob(), name)
}
