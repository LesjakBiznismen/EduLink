const fields = [
  ['first', 'Ime', 'text', 'given-name'],
  ['last', 'Priimek', 'text', 'family-name'],
  ['email', 'E-naslov', 'email', 'email'],
  ['school', 'Šola', 'text', 'organization'],
]

export default function ProfileFields({ values }) {
  return (
    <div className="profile-fields">
      {fields.map(([name, label, type, autoComplete]) => (
        <label className="field" key={name}>
          {label}
          <input
            name={name}
            type={type}
            defaultValue={values[name]}
            required={['first', 'last'].includes(name)}
            maxLength={100}
            autoComplete={autoComplete}
          />
        </label>
      ))}
    </div>
  )
}
