import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { parseIdentifier } from './helpers'

interface PatientSearchFormProps {
  initial?: string
  onSearch: (value: string) => void
  busy?: boolean
  autoFocus?: boolean
}

/** One field for a UHID or a mobile number; validated before anything is sent. */
export function PatientSearchForm({ initial = '', onSearch, busy = false, autoFocus = false }: PatientSearchFormProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState(initial)
  const [invalid, setInvalid] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!parseIdentifier(value)) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    onSearch(value.trim())
  }

  return (
    <form onSubmit={submit} noValidate role="search">
      <label htmlFor="patient-search" className="mb-1.5 block text-[13px] font-semibold text-body">
        {t('doctor.search.label')}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-faint" />
          <input
            id="patient-search"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (invalid) setInvalid(false)
            }}
            placeholder={t('doctor.search.placeholder')}
            autoFocus={autoFocus}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={invalid}
            aria-describedby={invalid ? 'patient-search-error' : undefined}
            className={`w-full rounded-xl border bg-white py-3.5 pl-12 pr-4 font-mono text-[15px] text-ink outline-none transition placeholder:font-sans placeholder:text-faint focus:ring-4 focus:ring-brand/10 ${
              invalid ? 'border-red-400 focus:border-red-400' : 'border-line focus:border-brand'
            }`}
          />
        </div>
        <Button type="submit" size="lg" disabled={busy} className="sm:w-auto">
          {busy ? t('doctor.search.searching') : t('doctor.search.submit')}
        </Button>
      </div>
      {invalid && (
        <p id="patient-search-error" role="alert" className="mt-1.5 text-xs font-medium text-red-500">
          {t('doctor.search.invalid')}
        </p>
      )}
    </form>
  )
}
