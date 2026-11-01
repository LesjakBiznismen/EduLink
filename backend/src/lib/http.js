// Napaka s HTTP statusom, ki jo obdelovalnik napak vrne odjemalcu kot JSON.
export class HttpError extends Error {
  // code (neobvezen) odjemalcu omogoča, da napako loči od drugih z istim statusom.
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const badRequest = message => new HttpError(400, message)
export const forbidden = (message = 'Za to dejanje nimate dovoljenja.') => new HttpError(403, message)
export const notFound = (message = 'Vir ni najden.') => new HttpError(404, message)
export const conflict = message => new HttpError(409, message)

// Pomožne funkcije za preverjanje vnosa.
export function text(value, { field, max = 200, required = false } = {}) {
  const result = value == null ? '' : String(value).trim()
  if (required && !result) throw badRequest(`Polje »${field}« je obvezno.`)
  if (result.length > max) throw badRequest(`Polje »${field}« je predolgo (največ ${max} znakov).`)
  return result
}

export function id(value, field = 'id') {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) throw badRequest(`Neveljaven ${field}.`)
  return n
}

export const isEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
export const isDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
