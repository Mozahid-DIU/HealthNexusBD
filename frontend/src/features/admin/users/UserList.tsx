import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { BadgeCheck, Lock, ShieldOff, ShieldCheck } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDate, initials } from '@/lib/format'
import type { Role } from '@/types/api'
import type { AccountStatus, AdminUser } from '../types'

const STATUS_TONE: Record<AccountStatus, BadgeTone> = { pending: 'warning', active: 'success', suspended: 'danger' }
const ROLE_TONE: Record<Role, BadgeTone> = { patient: 'brand', doctor: 'teal', lab: 'neutral', admin: 'neutral' }

/** The name to show for any account, and the identifier staff know it by. */
export function identity(user: AdminUser): { name: string; id: string | null } {
  if (user.patient) return { name: user.patient.fullName, id: user.patient.uhid }
  if (user.doctor) return { name: user.doctor.fullName, id: user.doctor.bmdcNumber }
  if (user.lab) return { name: user.lab.centerName, id: user.lab.licenseNumber }
  if (user.admin) return { name: user.admin.fullName, id: null }
  return { name: user.email, id: null }
}

function Action({ user, onToggle }: { user: AdminUser; onToggle: (user: AdminUser) => void }) {
  const { t } = useTranslation()
  const { name } = identity(user)
  if (user.role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-faint" title={t('admin.users.protected')}>
        <Lock aria-hidden className="h-3.5 w-3.5" />
        <span className="sr-only">{t('admin.users.protected')}</span>
      </span>
    )
  }
  const suspended = user.status === 'suspended'
  // A doctor or lab that was never verified is decided in Verifications (with the
  // registry check), never switched on from here.
  const unverified = user.doctor?.isBmdcVerified === false || user.lab?.isApproved === false
  if (suspended && unverified) {
    const type = user.role === 'lab' ? 'type=lab&' : ''
    return (
      <Link
        to={`/admin/verifications?${type}status=suspended`}
        aria-label={`${t('admin.users.verifyFirst')}: ${name}`}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/6 focus-visible:outline-2 focus-visible:outline-brand"
      >
        <BadgeCheck aria-hidden className="h-3.5 w-3.5" />
        {t('admin.users.verifyFirst')}
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onToggle(user)}
      aria-label={`${suspended ? t('admin.users.reactivate') : t('admin.users.suspend')}: ${name}`}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-brand ${
        suspended ? 'text-emerald-700 hover:bg-emerald-50' : 'text-red-700 hover:bg-red-50'
      }`}
    >
      {suspended ? <ShieldCheck aria-hidden className="h-3.5 w-3.5" /> : <ShieldOff aria-hidden className="h-3.5 w-3.5" />}
      {suspended ? t('admin.users.reactivate') : t('admin.users.suspend')}
    </button>
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/8 text-xs font-bold text-brand">
      {initials(name)}
    </span>
  )
}

/** Accounts as a table on wide screens and as cards on phones (same data, same actions). */
export function UserList({ users, onToggle }: { users: AdminUser[]; onToggle: (user: AdminUser) => void }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs font-semibold uppercase tracking-wide text-slate">
            <tr>
              <th scope="col" className="py-3 pr-4">{t('admin.users.name')}</th>
              <th scope="col" className="px-4 py-3">{t('admin.users.contact')}</th>
              <th scope="col" className="px-4 py-3">{t('admin.users.role')}</th>
              <th scope="col" className="px-4 py-3">{t('admin.users.status')}</th>
              <th scope="col" className="px-4 py-3">{t('admin.users.joined')}</th>
              <th scope="col" className="py-3 pl-4 text-right">
                <span className="sr-only">{t('admin.users.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => {
              const { name, id } = identity(user)
              return (
                <tr key={user.id} className="transition hover:bg-surface-soft/70">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={name} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{name}</p>
                        {id && <p className="font-mono text-xs text-slate">{id}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-[16rem] truncate text-body">{user.email}</p>
                    <p className="text-xs text-slate">{user.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={ROLE_TONE[user.role]}>{t(`roles.${user.role}`)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[user.status]}>{t(`status.${user.status}`)}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate">{formatDate(user.createdAt, lang)}</td>
                  <td className="py-3 pl-4 text-right">
                    <Action user={user} onToggle={onToggle} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {users.map((user) => {
          const { name, id } = identity(user)
          return (
            <li key={user.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              <Avatar name={name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{name}</p>
                <p className="truncate text-xs text-slate">
                  {id && <span className="font-mono">{id} · </span>}
                  {user.email}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone={ROLE_TONE[user.role]}>{t(`roles.${user.role}`)}</Badge>
                  <Badge tone={STATUS_TONE[user.status]}>{t(`status.${user.status}`)}</Badge>
                </div>
              </div>
              <div className="shrink-0 self-center">
                <Action user={user} onToggle={onToggle} />
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
