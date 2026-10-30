// Varni dostop do localStorage / sessionStorage in IndexedDB. Nič se ne pošilja na strežnik.
export const readJson = (store, key, fallback) => {
  try { return JSON.parse(window[store].getItem(key)) ?? fallback } catch { return fallback }
}
export const writeJson = (store, key, value) => { window[store].setItem(key, JSON.stringify(value)) }
export const readText = (store, key) => {
  try { return window[store].getItem(key) } catch { return null }
}
export const writeText = (store, key, value) => {
  try { window[store].setItem(key, value) } catch { /* Shramba ni na voljo. */ }
}
export const removeText = (store, key) => {
  try { window[store].removeItem(key) } catch { /* Shramba ni na voljo. */ }
}

const databases = {}
function open(name, store, options) {
  databases[name] ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(store, options)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return databases[name]
}

async function transaction(name, store, options, mode, run) {
  const db = await open(name, store, options)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const request = run(tx.objectStore(store))
    tx.oncomplete = () => resolve(request.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error || new Error('Shranjevanje ni uspelo.'))
  })
}

// Oddane naloge učenca (cele datoteke).
export const submissionsTx = (mode, run) => transaction('edulink-demo', 'submissions', { keyPath: 'id' }, mode, run)
// Gradiva, ki jih naložijo učitelji.
export const filesTx = (mode, run) => transaction('edulink-files', 'files', undefined, mode, run)
export const fileBlob = id => filesTx('readonly', s => s.get(id)).catch(() => null)
