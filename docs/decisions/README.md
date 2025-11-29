# Architecture decision records

Short records of decisions that were deliberately chosen over a
plausible alternative, and why. See `docs/architecture.md` for the
system overview these decisions support.

1. [Membership-based tenancy](0001-membership-based-tenancy.md)
2. [Cookie sessions instead of browser-stored bearer tokens](0002-cookie-sessions.md)
3. [Slot and allocation capacity model](0003-slot-allocation-capacity-model.md)
4. [Application-layer tenant isolation instead of database-specific RLS](0004-application-layer-tenant-isolation.md)
5. [Pending requests do not reserve capacity](0005-pending-requests-no-capacity-reservation.md)
