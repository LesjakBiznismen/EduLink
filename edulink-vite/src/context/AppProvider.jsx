import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppContext } from './appContext.js'
import { api, getToken, setToken, setUnauthorizedHandler } from '../lib/api.js'
import { fullName, initials } from '../lib/helpers.js'
import { downloadMaterial as fetchMaterial } from '../lib/materials.js'

const labels = { ucenec: 'Učenec', ucitelj: 'Učitelj', admin: 'Administrator' }

// Stanje aplikacije: prijavljeni uporabnik in podatki iz strežnika (predmeti, naloge, gradiva).
export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(() => !getToken())
  const [subjects, setSubjects] = useState([])
  const [selected, setSelected] = useState([])
  const [assignments, setAssignments] = useState([])
  const [materials, setMaterials] = useState([])
  const [message, setMessage] = useState('')
  const [chooserOpen, setChooserOpen] = useState(false)
  const toastTimer = useRef()

  const toast = useCallback(text => {
    setMessage(text)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setMessage(''), 5000)
  }, [])

  const reloadSubjects = useCallback(async () => setSubjects(await api.get('/subjects')), [])
  const reloadAssignments = useCallback(async () => setAssignments(await api.get('/assignments')), [])
  const reloadMaterials = useCallback(async () => setMaterials(await api.get('/materials')), [])

  // Po prijavi naloži vse, kar potrebujejo strani prijavljene vloge.
  const loadData = useCallback(async current => {
    const staff = current.role === 'admin'
    const [subs, mine, list, mats] = await Promise.all([
      api.get('/subjects'),
      staff ? [] : api.get('/me/subjects'),
      staff ? [] : api.get('/assignments'),
      staff ? [] : api.get('/materials'),
    ])
    setSubjects(subs)
    setSelected(mine)
    setAssignments(list)
    setMaterials(mats)
  }, [])

  const reset = useCallback(() => {
    setToken(null)
    setUser(null)
    setSubjects([])
    setSelected([])
    setAssignments([])
    setMaterials([])
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      reset()
      toast('Seja je potekla. Prijavite se znova.')
    })
  }, [reset, toast])

  // Ob osvežitvi strani obnovi sejo iz shranjenega žetona.
  useEffect(() => {
    if (!getToken()) return
    api.get('/auth/me')
      .then(async ({ user: current }) => {
        await loadData(current)
        setUser(current)
      })
      .catch(() => reset())
      .finally(() => setReady(true))
  }, [loadData, reset])

  const start = useCallback(async ({ token, user: current }) => {
    setToken(token)
    await loadData(current)
    setUser(current)
    setChooserOpen(false)
    return current
  }, [loadData])

  const login = useCallback(async (username, password) => start(await api.post('/auth/login', { username, password })), [start])
  const register = useCallback(async values => start(await api.post('/auth/register', values)), [start])
  const logout = useCallback(() => reset(), [reset])

  const saveProfile = useCallback(async values => {
    const next = await api.put('/profile', values)
    setUser(next)
    return next
  }, [])

  // Učenec shrani izbor predmetov (vpise); naloge in gradiva se nato naložijo znova.
  const saveSelection = useCallback(async next => {
    try {
      setSelected(await api.put('/me/subjects', { subjects: next }))
      await Promise.all([reloadAssignments(), reloadMaterials(), reloadSubjects()])
      return true
    } catch (error) {
      toast(error.message)
      return false
    }
  }, [reloadAssignments, reloadMaterials, reloadSubjects, toast])

  const saveSubmission = useCallback(async (assignmentId, file) => {
    const form = new FormData()
    form.append('file', file)
    const submission = await api.upload(`/assignments/${assignmentId}/submission`, form)
    setAssignments(current => current.map(a => (a.id === assignmentId ? { ...a, submission } : a)))
    return submission
  }, [])

  const downloadMaterial = useCallback((material, subjectName) => (
    fetchMaterial(material, subjectName).catch(error => toast(error.message))
  ), [toast])

  const role = user?.role ?? null
  const submissions = useMemo(
    () => Object.fromEntries(assignments.filter(a => a.submission).map(a => [a.id, a.submission])),
    [assignments],
  )
  const studentSubjects = useMemo(() => (role === 'ucenec' ? subjects.filter(s => selected.includes(s.id)) : []), [role, subjects, selected])
  const mySubjects = useMemo(() => (role === 'ucitelj' ? subjects.filter(s => selected.includes(s.id)) : []), [role, subjects, selected])
  const identity = useMemo(() => (user
    ? { name: fullName(user), initials: initials(user) || 'IP', label: labels[user.role] }
    : null), [user])

  const value = {
    ready, user, role, identity, profile: user, teacher: user, login, register, logout, saveProfile,
    subjects, assignments, materials, reloadSubjects, reloadAssignments, reloadMaterials,
    selected, saveSelection, studentSubjects, mySubjects, submissions, saveSubmission, downloadMaterial,
    toast, chooserOpen, setChooserOpen,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="toast" role="status" hidden={!message}>{message}</div>
    </AppContext.Provider>
  )
}
