# PawBookings CRM

A multitenant CRM and booking platform for dog daycare, boarding, and
training businesses. Staff manage services, availability, and incoming
booking requests; customers browse availability and request bookings
for their pets.

## Stack

- **Backend:** Ruby on Rails 8 (API mode), PostgreSQL, Pundit
  (authorization), Solid Queue (background jobs)
- **Frontend:** React (JavaScript, no TypeScript), Vite, React Router,
  TanStack Query

## Prerequisites

- Ruby 3.4.10 (see `backend/.ruby-version` — a version manager like
  `mise`, `rbenv`, or `rvm` will pick this up automatically)
- Node.js 20+
- Docker + Docker Compose (for PostgreSQL — or point the backend at
  your own local Postgres 16+ instead, see `.env.example`)

## Quick start

```sh
git clone <this-repo>
cd pawbookings-crm
cp .env.example .env

# 1. Database
docker compose up -d

# 2. Backend
cd backend
bundle install
bin/rails db:create db:migrate db:seed
bin/rails server            # http://localhost:3000

# 3. Background jobs (separate terminal, still in backend/)
bin/jobs

# 4. Frontend (separate terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Open `http://localhost:5173` and log in with one of the seeded demo
accounts below.

### Demo credentials

`db:seed` creates one fully set-up business, **Paws & Play Daycare**
(`paws-and-play`), with an account for every role (password
`password12345` for all of them):

| Role | Email |
|---|---|
| Owner | `owner@pawsandplay.example` |
| Admin | `admin@pawsandplay.example` |
| Staff | `staff@pawsandplay.example` |
| Customer | `customer@pawsandplay.example` |

The customer account has two pets and one booking in each status
(pending, accepted, denied, cancelled); the business has a daycare,
training, and boarding service with availability slots over the next
two weeks. `db:seed` is idempotent — safe to run again at any time.

## Running tests

```sh
cd backend && bundle exec rspec        # 182 examples
cd frontend && npm test                # 16 tests
```

See [docs/testing.md](docs/testing.md) for what's covered (including
the real-thread concurrency specs) and why a couple of common testing
tools (E2E browser tests, load testing) were deliberately left out.

## Linting and security scanning

```sh
cd backend
bundle exec rubocop           # style
bundle exec brakeman -q       # static security analysis
bundle exec bundler-audit check --update   # dependency vulnerabilities

cd frontend
npm run lint                  # ESLint
npm audit                     # dependency vulnerabilities
```

## Project layout

```
backend/   Rails API (app/, config/, db/, spec/)
frontend/  React SPA (src/)
docs/      Architecture notes, ADRs, and the API reference
```

## Documentation

- [Architecture overview](docs/architecture.md) — system shape, domain
  model, and rejected alternatives
- [Data flow](docs/data-flow.md) — sequence diagrams for auth, booking
  requests, and booking acceptance
- [Tenancy](docs/tenancy.md) — how a business is isolated from every
  other business's data
- [Authorization](docs/authorization.md) — the Pundit policy layer and
  a full role capability matrix
- [Idempotency](docs/idempotency.md) — the `Idempotency-Key` lifecycle
  for booking mutations
- [Performance](docs/performance.md) — N+1 prevention, indexing, and
  what was deliberately not built (yet)
- [Testing](docs/testing.md) — test pyramid, the concurrency-testing
  pattern, and coverage boundaries
- [Architecture decision records](docs/decisions/) — specific
  decisions made over a plausible alternative, and why
- [openapi.yaml](docs/openapi.yaml) — full API reference (paste into
  [Swagger Editor](https://editor.swagger.io/) or any OpenAPI viewer)

## Known limitations

- Single-region, single-database deployment target — see
  [docs/architecture.md](docs/architecture.md) for the reasoning
  (no microservices, no read replica, no cache layer) and what would
  change first if that stopped being true.
- No real SMTP provider is configured for production
  (`config/environments/production.rb` still has Rails' default,
  commented-out SMTP settings) — booking decision emails would fail to
  send until real credentials are added via `bin/rails
  credentials:edit`. Development uses the `:file` delivery method
  (written to `tmp/mails/`) and test uses `:test` (assertable via
  `ActionMailer::Base.deliveries`), so this only matters for an actual
  production deployment, which this project has never had.
- `platform_admin` (a support-staff escalation flag on `User`) exists
  as a schema column and a documented invariant
  ([docs/tenancy.md](docs/tenancy.md#optional-platform-admin-access))
  but has no actual UI or controller logic yet — reserved for a future
  support-tooling milestone, not implemented.

