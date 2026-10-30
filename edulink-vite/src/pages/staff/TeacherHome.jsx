import { Navigate } from 'react-router-dom'
import EmptyState from '../../components/EmptyState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import SubjectCard from '../../components/SubjectCard.jsx'
import { useApp } from '../../context/appContext.js'

// Učitelj z enim samim predmetom vedno pristane neposredno na strani predmeta.
export default function TeacherHome() {
  const { mySubjects } = useApp()
  if (mySubjects.length === 1) return <Navigate to={`/predmeti/${mySubjects[0].id}`} replace />
  return (
    <>
      <PageHeader title="Predmeti" />
      {mySubjects.length ? (
        <div className="predmeti">{mySubjects.map(s => <SubjectCard key={s.id} subject={s} />)}</div>
      ) : <EmptyState title="Nimate predmetov" copy="Administrator vam še ni dodelil predmeta." />}
    </>
  )
}
