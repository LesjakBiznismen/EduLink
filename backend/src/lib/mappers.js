// Pretvorba vrstic iz baze v obliko, ki jo pričakuje odjemalec (edulink-vite).

// SQLite hrani čas kot "YYYY-MM-DD HH:MM:SS" v UTC.
export const isoDateTime = value => (value ? `${value.replace(' ', 'T')}Z` : null)
export const isoDate = value => (value ? value.slice(0, 10) : null)

export function toUser(row) {
  return {
    id: row.id_uporabnik,
    username: row.uporabnisko_ime,
    email: row.e_posta,
    first: row.ime,
    last: row.priimek,
    role: row.vloga,
    school: row.sola ?? '',
    phone: row.telefon ?? '',
    title: row.naziv ?? '',
    office: row.kabinet ?? '',
  }
}

export function toPerson(row) {
  return { id: row.id_uporabnik, first: row.ime, last: row.priimek }
}

export function toSubject(row) {
  return {
    id: row.koda,
    dbId: row.id_predmet,
    name: row.naziv,
    short: row.kratica,
    color: row.barva,
    image: row.slika,
    description: row.opis ?? '',
  }
}

export function toAssignment(row) {
  return {
    id: row.id_naloga,
    subject: row.koda,
    title: row.naslov,
    description: row.navodila,
    due: row.rok_oddaje,
    created: isoDateTime(row.ustvarjeno_ob),
  }
}

export function toSubmission(row) {
  return {
    id: row.id_oddaja,
    assignment: row.id_naloga,
    student: row.id_ucenec,
    name: row.datoteka_ime,
    originalName: row.izvirno_ime_datoteke,
    size: row.velikost_bajtov,
    savedAt: isoDateTime(row.oddano_ob),
    grade: row.ocena ?? null,
    feedback: row.povratna_informacija ?? '',
    gradedAt: isoDateTime(row.ocenjeno_ob),
  }
}

export function toMaterial(row) {
  return {
    id: row.id_gradivo,
    subject: row.koda,
    title: row.naslov,
    type: row.vrsta,
    content: row.vsebina ?? '',
    added: isoDate(row.dodano_ob),
    by: row.nalozil,
    fileName: row.datoteka_ime,
    fileType: row.tip_datoteke,
    size: row.velikost_bajtov,
  }
}
