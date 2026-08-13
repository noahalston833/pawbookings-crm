import { describe, expect, it } from 'vitest'
import { buildBusinessNavItems } from './businessNavigation'

describe('buildBusinessNavItems', () => {
  it('gives a customer their own set of links, ending with Profile', () => {
    const items = buildBusinessNavItems('paws-and-play', 'customer')

    expect(items.map((item) => item.label)).toEqual([
      'Dashboard', 'My Pets', 'Find Availability', 'My Bookings', 'Profile',
    ])
    expect(items[0]).toEqual({ to: '/paws-and-play', label: 'Dashboard', end: true })
  })

  it('gives staff booking/availability/services/pets but no team or audit log', () => {
    const items = buildBusinessNavItems('paws-and-play', 'staff')
    const labels = items.map((item) => item.label)

    expect(labels).toEqual([ 'Dashboard', 'Booking Requests', 'Availability', 'Services', 'Pets' ])
    expect(labels).not.toContain('Team')
    expect(labels).not.toContain('Audit Log')
    expect(labels).not.toContain('Settings')
  })

  it('gives admin everything staff has, plus Customers, Team, and Audit Log, but no Settings', () => {
    const labels = buildBusinessNavItems('paws-and-play', 'admin').map((item) => item.label)

    expect(labels).toEqual([
      'Dashboard', 'Booking Requests', 'Availability', 'Services', 'Customers', 'Pets', 'Team', 'Audit Log',
    ])
    expect(labels).not.toContain('Settings')
  })

  it('gives the owner everything admin has, plus Settings last', () => {
    const labels = buildBusinessNavItems('paws-and-play', 'owner').map((item) => item.label)

    expect(labels[labels.length - 1]).toBe('Settings')
    expect(labels).toContain('Team')
    expect(labels).toContain('Audit Log')
  })

  it('returns an empty list for an unrecognized or missing role', () => {
    expect(buildBusinessNavItems('paws-and-play', undefined)).toEqual([])
    expect(buildBusinessNavItems('paws-and-play', 'not-a-role')).toEqual([])
  })

  it('scopes every link under the given business slug', () => {
    const items = buildBusinessNavItems('city-tails', 'owner')

    for (const item of items) {
      expect(item.to.startsWith('/city-tails')).toBe(true)
    }
  })
})
