import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// Administrator: število predmetov, učiteljev, učencev, nalog, oddaj in gradiv.
router.get('/', async (_req, res) => {
  res.json(await db.get(`
    SELECT
      (SELECT count(*) FROM predmeti) AS subjects,
      (SELECT count(*) FROM uporabniki WHERE vloga = 'ucitelj') AS teachers,
      (SELECT count(*) FROM uporabniki WHERE vloga = 'ucenec') AS students,
      (SELECT count(*) FROM naloge) AS assignments,
      (SELECT count(*) FROM oddaje) AS submissions,
      (SELECT count(*) FROM gradiva WHERE izbrisano_ob IS NULL) AS materials`))
})

export default router
