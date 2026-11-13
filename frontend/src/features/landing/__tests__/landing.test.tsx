import { afterEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { routes } from '@/app/routes'
import { i18n } from '@/i18n'
import { renderRoutes } from '@/test/render'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('landing page', () => {
  it('leads with the promise and two clear ways in', async () => {
    renderRoutes(routes, '/')
    const h1 = await screen.findByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('One lifelong Health ID for every citizen')

    const hero = h1.closest('section')!
    expect(within(hero).getByRole('link', { name: /Get started — free/ })).toHaveAttribute('href', '/register')
    expect(within(hero).getByRole('link', { name: 'I already have an account' })).toHaveAttribute('href', '/login')
  })

  it('links the navigation to every section that exists on the page', async () => {
    renderRoutes(routes, '/')
    // Desktop bar and the phone drawer: every link must lead somewhere real.
    const navs = await screen.findAllByRole('navigation', { name: 'Menu' })
    expect(navs).toHaveLength(2)
    for (const link of navs.flatMap((nav) => within(nav).getAllByRole('link', { hidden: true }))) {
      const id = link.getAttribute('href')!.slice(1)
      expect(document.getElementById(id), `#${id}`).not.toBeNull()
    }
  })

  it('keeps a quiet way into the admin console in the footer', async () => {
    renderRoutes(routes, '/')
    const footer = await screen.findByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: 'Admin console' })).toHaveAttribute('href', '/admin/login')
  })

  it('shows what each role gets, one tab at a time', async () => {
    renderRoutes(routes, '/')
    await screen.findByRole('heading', { name: 'One platform, four roles' })
    expect(screen.getByText('Approve or refuse every access request')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: 'Labs' }))

    expect(screen.getByText('See only the tests a doctor ordered')).toBeInTheDocument()
    expect(screen.queryByText('Approve or refuse every access request')).not.toBeInTheDocument()
  })

  it('states only true security numbers, readable without the animation', async () => {
    renderRoutes(routes, '/')
    const security = (await screen.findByRole('heading', { name: /Privacy isn’t a feature/ })).closest('section')!
    // The values screen readers get (the counting digits beside them are decorative).
    const finals = [...security.querySelectorAll('.sr-only')].map((el) => el.textContent)
    expect(finals).toEqual(expect.arrayContaining(['256', '6', '5', '30']))
  })

  it('opens the mobile menu with every link and both calls to action', async () => {
    renderRoutes(routes, '/')
    const toggle = await screen.findByRole('button', { name: 'Toggle menu' })
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const drawer = document.getElementById('landing-mobile-menu')!
    expect(within(drawer).getByRole('link', { name: 'Security' })).toHaveAttribute('href', '#security')
    expect(within(drawer).getByRole('link', { name: 'Register free' })).toHaveAttribute('href', '/register')
  })

  it('reads entirely in Bangla when switched', async () => {
    await i18n.changeLanguage('bn')
    renderRoutes(routes, '/')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('প্রত্যেক নাগরিকের জন্য একটি আজীবন হেলথ আইডি')
    const ENGLISH = /Get started|Features|How it works|Security|Log in|Register|Patients|Doctors|Privacy|Made in|lifelong|consent code|Your health/
    // The language demo deliberately shows one English sample, marked lang="en".
    const text = [...document.body.querySelectorAll('*')]
      .filter((el) => el.children.length === 0 && !el.closest('[lang="en"]'))
      .map((el) => el.textContent)
      .join(' ')
    expect(text).not.toMatch(ENGLISH)
  })
})
