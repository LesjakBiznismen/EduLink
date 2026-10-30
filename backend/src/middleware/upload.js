import multer from 'multer'
import { config } from '../config.js'
import { badRequest } from '../lib/http.js'

// Datoteka ostane v pomnilniku, dokler je ne shranimo pod id-jem zapisa iz baze.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSize, files: 1 },
})

// multer imena datotek bere kot latin1; popravimo jih v UTF-8 (šumniki).
const fixName = file => {
  if (file) file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
}

export const singleFile = field => (req, res, next) => {
  upload.single(field)(req, res, error => {
    if (error?.code === 'LIMIT_FILE_SIZE') return next(badRequest('Datoteka je prevelika. Izberite datoteko do 20 MB.'))
    if (error) return next(badRequest('Datoteke ni bilo mogoče prebrati.'))
    fixName(req.file)
    next()
  })
}
