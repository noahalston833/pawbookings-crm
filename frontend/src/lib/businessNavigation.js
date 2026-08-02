// Centralizes "who sees which nav items" so BusinessLayout and its tests
// share one definition instead of role checks scattered through JSX.
export function buildBusinessNavItems(businessSlug, role) {
  const base = (slug) => `/${businessSlug}${slug}`

  if (role === 'customer') {
    return [
      { to: base(''), label: 'Dashboard', end: true },
      { to: base('/pets'), label: 'My Pets' },
      { to: base('/services'), label: 'Find Availability' },
      { to: base('/bookings'), label: 'My Bookings' },
      { to: base('/profile'), label: 'Profile' },
    ]
  }

  const staffOrAbove = [
    { to: base(''), label: 'Dashboard', end: true },
    { to: base('/bookings'), label: 'Booking Requests' },
    { to: base('/availability'), label: 'Availability' },
    { to: base('/services'), label: 'Services' },
  ]

  if (role === 'staff') {
    return [ ...staffOrAbove, { to: base('/pets'), label: 'Pets' } ]
  }

  if (role === 'admin' || role === 'owner') {
    const items = [
      ...staffOrAbove,
      { to: base('/customers'), label: 'Customers' },
      { to: base('/pets'), label: 'Pets' },
      { to: base('/members'), label: 'Team' },
      { to: base('/audit-log'), label: 'Audit Log' },
    ]

    if (role === 'owner') items.push({ to: base('/settings'), label: 'Settings' })

    return items
  }

  return []
}
