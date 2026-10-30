import { Link } from 'react-router-dom'
import { imgSrc } from '../lib/helpers.js'

export default function SubjectCard({ subject }) {
  return (
    <article className="predmet">
      <img className="predmet-slika" src={imgSrc(subject)} alt="" />
      <div className="predmet-vsebina">
        <h2 className="predmet-ime">
          <Link className="subject-card-link" to={`/predmeti/${subject.id}`}>{subject.name}</Link>
        </h2>
      </div>
    </article>
  )
}
