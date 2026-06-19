# Data flow

## Authentication flow

Cookie-based sessions, not bearer tokens in local storage (see
[ADR 0002](decisions/0002-cookie-sessions.md)).

```mermaid
sequenceDiagram
    participant Browser
    participant Rails as Rails API
    participant DB as PostgreSQL

    Browser->>Rails: POST /api/v1/session { email, password }
    Rails->>DB: SELECT user WHERE email = normalized_email
    DB-->>Rails: user row (password_digest)
    Rails->>Rails: BCrypt verify password
    Rails-->>Browser: 200 + Set-Cookie (HttpOnly, Secure, SameSite=Lax)
    Note over Browser,Rails: Later requests
    Browser->>Rails: GET /api/v1/businesses/:slug/... (cookie sent automatically)
    Rails->>Rails: Load user from session, verify CSRF token on mutations
    Rails-->>Browser: 200 / 401 if no valid session
```

The session cookie is opaque to JavaScript (`HttpOnly`): the frontend
never reads or stores a token, so there's nothing for an XSS payload to
exfiltrate from `localStorage`. CSRF protection covers the cookie being
replayed cross-site.

## Booking-request data flow

Pending requests **do not** reserve capacity (see
[ADR 0005](decisions/0005-pending-requests-no-capacity-reservation.md)).
This flow is intentionally simple — no locking is needed here because
nothing is being reserved yet.

```mermaid
sequenceDiagram
    participant Browser
    participant Rails as Rails API
    participant DB as PostgreSQL

    Browser->>Rails: POST .../bookings (Idempotency-Key: k1)
    Rails->>DB: SELECT idempotency_records WHERE key = k1 AND ...
    alt key seen before, same payload
        DB-->>Rails: existing record
        Rails-->>Browser: original stored response (replayed)
    else key seen before, different payload
        Rails-->>Browser: 409 idempotency_conflict
    else new key
        Rails->>DB: INSERT booking (status: pending), pets, idempotency_record
        DB-->>Rails: booking
        Rails-->>Browser: 201 booking (status: pending)
    end
```

See [docs/idempotency.md](idempotency.md) for the full
key/fingerprint/expiry lifecycle.

## Booking-approval data flow

Acceptance is the one place capacity is actually checked and reserved,
so it needs row locking and a transaction (see
[ADR 0003](decisions/0003-slot-allocation-capacity-model.md)).

```mermaid
sequenceDiagram
    participant Staff as Owner/Admin (Browser)
    participant Rails as Rails API
    participant DB as PostgreSQL

    Staff->>Rails: POST .../bookings/:id/accept (Idempotency-Key: k2)
    Rails->>DB: BEGIN
    Rails->>DB: SELECT availability_slots ... FOR UPDATE (locked in id order)
    DB-->>Rails: locked slot rows
    Rails->>Rails: capacity - accepted_allocations >= pets_requested ?
    alt capacity available on every required night/slot
        Rails->>DB: INSERT booking_allocations, UPDATE booking SET status = accepted
        Rails->>DB: COMMIT
        Rails-->>Staff: 200 booking (status: accepted)
        Rails->>Rails: enqueue BookingAcceptedNotificationJob(business_id, booking_id)
    else capacity gone on any required night/slot
        Rails->>DB: ROLLBACK
        Rails-->>Staff: 409 availability_conflict
    end
```

Locking every affected slot in a consistent order (by primary key)
before checking capacity is what prevents two concurrent accept
requests from both seeing "capacity available" and both succeeding —
see the concurrency test described in [docs/testing.md](testing.md)
that exercises this with two simultaneous requests for the last slot.
