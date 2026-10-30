import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppContext } from './appContext.js'
import { baseSubjects } from '../data/subjects.js'
import { seed } from '../data/seed.js'
import { fullName, initials, localIso } from '../lib/helpers.js'
import { readJson, readText, removeText, submissionsTx, writeJson, writeText } from '../lib/storage.js'

const STORE_KEY = 'edulink-staff-v1'
const PROFILE_KEY = 'edulink-profile'
const defaultProfile = { first: 'Ime', last: 'Priimek', email: '', school: '' }

function loadStore() {
  let state = null
  try { state = JSON.parse(localStorage.getItem(STORE_KEY)) } catch { /* Shramba ni na voljo. */ }
  if (!state?.subjects?.length) state = seed()
  state.assignments ||= []
  state.materials ||= []
  state.removedMaterials ||= []
  return state
}

// Roki so vezani na dan prvega obiska, da ostanejo enaki ob osvežitvi.
function loadAnchor() {
  const saved = readText('localStorage', 'edulink-schedule')
  const base = saved && !Number.isNaN(Date.parse(saved)) ? new Date(saved) : new Date()
  base.setHours(12, 0, 0, 0)
  writeText('localStorage', 'edulink-schedule', base.toISOString())
  return base
}

function loadSession() {
  const role = readText('sessionStorage', 'edulink-role')
  if (!['ucenec', 'ucitelj', 'admin'].includes(role)) return null
  return { role, teacher: readText('sessionStorage', 'edulink-teacher') }
}

export function AppProvider({ children }) {
  const [store, setStore] = useState(loadStore)
  const [anchor] = useState(loadAnchor)
  const [profile, setProfile] = useState(() => ({ ...defaultProfile, ...readJson('localStorage', PROFILE_KEY, {}) }))
  const [session, setSession] = useState(loadSession)
  const [selected, setSelected] = useState(() => readJson('sessionStorage', 'edulink-subjects', []))
  const [submissions, setSubmissions] = useState({})
  const [message, setMessage] = useState('')
  const [chooserOpen, setChooserOpen] = useState(false)
  const toastTimer = useRef()

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)) } catch { /* Demo še vedno deluje do osvežitve. */ }
  }, [store])

  const toast = useCallback(text => {
    setMessage(text)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setMessage(''), 5000)
  }, [])

  useEffect(() => {
    submissionsTx('readonly', s => s.getAll())
      .then(rows => setSubmissions(Object.fromEntries(rows.map(row => [row.id, row]))))
      .catch(() => toast('Lokalna shramba ni na voljo. Oddaj trenutno ni mogoče shraniti.'))
  }, [toast])

  const updateStore = useCallback(change => {
    setStore(current => {
      const next = structuredClone(current)
      change(next)
      return next
    })
  }, [])

  // Predmeti, naloge in gradiva so izpeljani iz osnovnih vsebin in sprememb administratorja/učiteljev.
  const { subjects, assignments, materials } = useMemo(() => {
    const date = offset => {
      const d = new Date(anchor)
      d.setDate(d.getDate() + offset)
      return localIso(d)
    }
    const subjects = store.subjects.map(s => ({
      short: s.name.slice(0, 3).toUpperCase(), color: '#5c8fba', topic: 'Uvod', task: 'Prva naloga',
      description: 'Navodila za nalogo bo dodal učitelj.', text: 'Gradivo bo dodal učitelj.',
      ...baseSubjects.find(b => b.id === s.id), ...s,
    }))
    const known = new Set(subjects.map(s => s.id))
    const assignments = [
      ...subjects.flatMap((s, i) => [
        { id: `${s.id}-1`, subject: s.id, title: s.task, description: s.description, due: date(i + 1) },
        { id: `${s.id}-2`, subject: s.id, title: `Ponavljanje: ${s.topic.toLowerCase()}`, description: 'Pripravite kratek povzetek poglavja in tri vprašanja za ponavljanje. Pri vsakem vprašanju napišite tudi odgovor.', due: date(i + 9) },
      ]),
      ...store.assignments.filter(a => known.has(a.subject)),
    ]
    const baseIds = new Set(baseSubjects.map(b => b.id))
    const removed = new Set(store.removedMaterials)
    const generated = subjects.flatMap(s => [
      { id: `${s.id}-notes`, subject: s.id, title: s.topic, type: 'Zapiski', content: s.text, added: date(-2) },
      { id: `${s.id}-practice`, subject: s.id, title: `Vaje · ${s.topic}`, type: 'Vaje', content: `${s.description}\n\nZa ponavljanje\n1. S svojimi besedami razložite ključne pojme.\n2. Dodajte svoj primer.\n3. Zapišite vprašanje, o katerem bi se želeli pogovoriti pri pouku.`, added: date(-4) },
    ])
    const materials = [
      ...generated.filter(m => baseIds.has(m.subject) && !removed.has(m.id)),
      ...store.materials.filter(m => known.has(m.subject)),
    ]
    return { subjects, assignments, materials }
  }, [store, anchor])

  const role = session?.role ?? null
  const teacher = useMemo(
    () => store.teachers.find(t => t.id === session?.teacher) || store.teachers[0],
    [store.teachers, session],
  )
  const mySubjects = useMemo(
    () => (role === 'ucitelj' ? subjects.filter(s => teacher.subjects.includes(s.id)) : []),
    [role, subjects, teacher],
  )
  const identity = useMemo(() => {
    if (role === 'admin') return { name: 'Administrator', initials: 'AD', label: 'Administrator' }
    if (role === 'ucitelj') return { name: fullName(teacher), initials: initials(teacher), label: 'Učitelj' }
    return { name: fullName(profile), initials: initials(profile) || 'IP', label: 'Učenec' }
  }, [role, teacher, profile])

  const login = useCallback((nextRole, teacherId) => {
    writeText('sessionStorage', 'edulink-role', nextRole)
    if (nextRole === 'ucitelj' && teacherId) writeText('sessionStorage', 'edulink-teacher', teacherId)
    else removeText('sessionStorage', 'edulink-teacher')
    try { writeJson('sessionStorage', 'edulink-subjects', []) } catch { /* Izbira se ne ohrani. */ }
    setSelected([])
    setSession({ role: nextRole, teacher: nextRole === 'ucitelj' ? teacherId : null })
  }, [])

  const logout = useCallback(() => {
    removeText('sessionStorage', 'edulink-role')
    removeText('sessionStorage', 'edulink-teacher')
    setSession(null)
  }, [])

  // Vrže napako, če brskalnik ne dovoli shranjevanja.
  const saveProfile = useCallback(values => {
    const next = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v).trim()]))
    writeJson('localStorage', PROFILE_KEY, next)
    setProfile(next)
  }, [])

  const saveSelection = useCallback(next => {
    try {
      writeJson('sessionStorage', 'edulink-subjects', next)
      setSelected(next)
      return true
    } catch {
      toast('Brskalnik ne dovoli shranjevanja izbora. Omogočite lokalno shrambo.')
      return false
    }
  }, [toast])

  const saveSubmission = useCallback(async record => {
    await submissionsTx('readwrite', s => s.put(record))
    setSubmissions(current => ({ ...current, [record.id]: record }))
  }, [])

  const studentSubjects = useMemo(() => subjects.filter(s => selected.includes(s.id)), [subjects, selected])

  const value = {
    store, updateStore, subjects, assignments, materials,
    profile, saveProfile, session, role, teacher, mySubjects, identity, login, logout,
    selected, saveSelection, studentSubjects, submissions, saveSubmission,
    toast, chooserOpen, setChooserOpen,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="toast" role="status" hidden={!message}>{message}</div>
    </AppContext.Provider>
  )
}
