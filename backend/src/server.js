import { app } from './app.js'
import { config } from './config.js'

app.listen(config.port, () => {
  console.log(`EduLink API posluša na http://localhost:${config.port} (baza: PostgreSQL)`)
})
