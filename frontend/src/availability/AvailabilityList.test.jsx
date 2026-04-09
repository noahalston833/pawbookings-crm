import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AvailabilityList } from './AvailabilityList'

describe('AvailabilityList', () => {
  const slots = [
    { id: 1, starts_at: '2026-09-01T09:00:00Z', ends_at: '2026-09-01T17:00:00Z', capacity: 5, remaining_capacity: 2 },
    { id: 2, starts_at: '2026-09-02T09:00:00Z', ends_at: '2026-09-02T17:00:00Z', capacity: 5, remaining_capacity: 0 },
  ]

  it('shows remaining capacity for each slot', () => {
    render(<AvailabilityList slots={slots} timeZone="UTC" selectedIds={[]} onToggle={() => {}} />)

    expect(screen.getByText(/2 of 5 remaining/)).toBeInTheDocument()
    expect(screen.getByText(/0 of 5 remaining/)).toBeInTheDocument()
  })

  it('disables selecting a slot with no remaining capacity', () => {
    render(<AvailabilityList slots={slots} timeZone="UTC" selectedIds={[]} onToggle={() => {}} />)

    expect(screen.getAllByRole('checkbox')[1]).toBeDisabled()
  })

  it('calls onToggle with the slot id when a selectable slot is clicked', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<AvailabilityList slots={slots} timeZone="UTC" selectedIds={[]} onToggle={onToggle} />)

    await user.click(screen.getAllByRole('checkbox')[0])

    expect(onToggle).toHaveBeenCalledWith(1)
  })

  it('shows an empty state when there are no slots', () => {
    render(<AvailabilityList slots={[]} timeZone="UTC" selectedIds={[]} onToggle={() => {}} />)

    expect(screen.getByText(/No availability found/)).toBeInTheDocument()
  })
})
