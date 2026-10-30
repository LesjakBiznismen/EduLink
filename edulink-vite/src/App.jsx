import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { useApp } from './context/appContext.js'
import Assignments from './pages/Assignments.jsx'
import Calendar from './pages/Calendar.jsx'
import Classroom from './pages/Classroom.jsx'
import Login from './pages/Login.jsx'
import Materials from './pages/Materials.jsx'
import Profile from './pages/Profile.jsx'
import Register from './pages/Register.jsx'
import SubjectPage from './pages/SubjectPage.jsx'
import AdminPeople from './pages/staff/AdminPeople.jsx'
import AdminSubjects from './pages/staff/AdminSubjects.jsx'
import TeacherHome from './pages/staff/TeacherHome.jsx'
import TeacherMaterials from './pages/staff/TeacherMaterials.jsx'
import TeacherSubject from './pages/staff/TeacherSubject.jsx'
import TeacherSubmissions from './pages/staff/TeacherSubmissions.jsx'

// Prikaže stran glede na vlogo; za vloge brez strani preusmeri na seznam predmetov.
function ByRole({ ucenec, ucitelj, admin }) {
  const { role } = useApp()
  const page = { ucenec, ucitelj, admin }[role]
  return page || <Navigate to="/predmeti" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/prijava" element={<Login />} />
      <Route path="/registracija" element={<Register />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/predmeti" replace />} />
        <Route path="predmeti" element={<ByRole ucenec={<Classroom />} ucitelj={<TeacherHome />} admin={<AdminSubjects />} />} />
        <Route path="predmeti/:id" element={<ByRole ucenec={<SubjectPage />} ucitelj={<TeacherSubject />} />} />
        <Route path="naloge" element={<ByRole ucenec={<Assignments />} ucitelj={<TeacherSubmissions />} />} />
        <Route path="gradiva" element={<ByRole ucenec={<Materials />} ucitelj={<TeacherMaterials />} />} />
        <Route path="koledar" element={<ByRole ucenec={<Calendar />} />} />
        <Route path="profil" element={<ByRole ucenec={<Profile />} ucitelj={<Profile />} admin={<Profile />} />} />
        <Route path="ucitelji" element={<ByRole admin={<AdminPeople kind="teachers" />} />} />
        <Route path="ucenci" element={<ByRole admin={<AdminPeople kind="students" />} />} />
      </Route>
      <Route path="*" element={<Navigate to="/predmeti" replace />} />
    </Routes>
  )
}
