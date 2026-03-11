# Ticket Management System (MOD-I)

This project contains a full-stack ticket management system:

- **Frontend**: React (Vite) in `./client`
- **Backend**: FastAPI (Python) in `./server`
- **Database**: PostgreSQL (managed via Docker + Alembic)

## Setup
1. Ensure Docker Desktop is running.
2. Copy `.env` and fill in your values.
3. Run `docker compose up --build`.
4. Run database migrations (see below).

## Access
- Frontend: `http://localhost:5175` (Run `npm run dev` in `client/` for dev mode)
- Backend: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

## Docker commands

```bash
# Build and start all containers
docker compose up --build

# Start in detached mode
docker compose up -d

# Stop and remove volumes
docker compose down -v

# Check status
docker compose ps
```

## Database Migrations (Alembic)

```bash
# Apply all pending migrations
docker compose exec backend alembic upgrade head

# Create a new migration after changing models
docker compose exec backend alembic revision --autogenerate -m "describe change"

# Rollback one migration
docker compose exec backend alembic downgrade -1

# Check current state
docker compose exec backend alembic current
```

## Data Seeding

Seeds the database with realistic dummy data (5 teams, 14 users, 12 tickets).
Automatically skips records that already exist.

```bash
# Run seed (skips if data already exists)
docker compose exec backend python -m app.utils.seed

# Force re-seed (skips existing, does not delete)
docker compose exec backend python -m app.utils.seed --force
```

```
docker compose exec postgres psql -U postgres -d mod_ticketing -c "\dt"
```

### Default Test Accounts

| Role  | Email                      | Password   |
|-------|----------------------------|------------|
| G1    | g1.admin@example.com       | pass123    |
| Admin | superadmin@example.com     | pass123    |
| Unit  | unit.alpha@example.com     | pass123    |
| Team  | elec.worker1@example.com   | pass123    |

## View database in Docker

```bash
docker compose exec postgres psql -U postgres -d mod_ticketing
\dt
```
