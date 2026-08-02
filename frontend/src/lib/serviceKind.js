const SERVICE_KIND_LABELS = {
  daycare: 'Dog Daycare',
  training: 'Dog Training',
  boarding: 'Dog Boarding',
}

export const SERVICE_KINDS = Object.keys(SERVICE_KIND_LABELS)

export function serviceKindLabel(kind) {
  return SERVICE_KIND_LABELS[kind] ?? kind
}
