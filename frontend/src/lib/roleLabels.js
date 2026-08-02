const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  staff: 'Staff',
  customer: 'Customer',
}

export const ALL_ROLES = Object.keys(ROLE_LABELS)

export function roleLabel(role) {
  return ROLE_LABELS[role] ?? role
}
