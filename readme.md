## MarketScan 360

MarketScan 360 is scaffolded as a real monorepo with:

- `backend/`: FastAPI + GraphQL + PostgreSQL-ready backend.
- `frontend/`: React + TypeScript application with functional left navigation and dual themes.
- `docker-compose.yml`: local PostgreSQL fallback using your requested credentials.

## Product goal

This platform is built as an AI-assisted B2B company review and product intelligence system.

- It tracks company details, products, social signals, review evidence, competitors, and promo angles.
- It keeps platform links visible so the team can see where every comment or review came from.
- It supports local export and report saving.
- It includes both dark mode and light mode with a more unusual visual direction than a standard SaaS dashboard.

## Backend

Stack:

- FastAPI
- Strawberry GraphQL
- SQLAlchemy async
- PostgreSQL via `asyncpg`

Key files:

- [backend/app/main.py](/D:/Marketscan%20360/backend/app/main.py)
- [backend/app/api/routes.py](/D:/Marketscan%20360/backend/app/api/routes.py)
- [backend/app/graphql/schema.py](/D:/Marketscan%20360/backend/app/graphql/schema.py)
- [backend/app/models/entities.py](/D:/Marketscan%20360/backend/app/models/entities.py)
- [backend/app/services/scan_service.py](/D:/Marketscan%20360/backend/app/services/scan_service.py)
- [backend/app/services/export_service.py](/D:/Marketscan%20360/backend/app/services/export_service.py)

Default database URL:

```text
postgresql+asyncpg://postgres:5688353@localhost:5432/marketscan360
```

Backend run steps:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
cd ..
uvicorn app.main:app --app-dir backend --reload
```

What is already wired:

- table creation on startup
- seeded demo company workspace
- `/api/companies`
- `/api/companies/{slug}/workspace`
- `/api/scans`
- local export endpoints for JSON, CSV, and HTML report
- GraphQL endpoint at `/graphql`

## Frontend

Stack:

- React 18
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand

Key files:

- [frontend/src/app/App.tsx](/D:/Marketscan%20360/frontend/src/app/App.tsx)
- [frontend/src/components/AppShell.tsx](/D:/Marketscan%20360/frontend/src/components/AppShell.tsx)
- [frontend/src/components/DashboardPanels.tsx](/D:/Marketscan%20360/frontend/src/components/DashboardPanels.tsx)
- [frontend/src/styles/index.css](/D:/Marketscan%20360/frontend/src/styles/index.css)

Frontend run steps:

```powershell
cd frontend
Copy-Item .env.example .env
cmd /c npm install
cmd /c npm run dev
```

What is already wired:

- functional left-side navigation
- routed pages for dashboard, scan, companies, social, gaps, competitors, promo, reports, exports, and source vault
- backend-driven workspace dashboard
- platform/source cards showing origin links
- comment/review feed with source labels and source URLs
- dark mode and light mode with local storage persistence
- local export buttons calling backend endpoints

## PostgreSQL

If PostgreSQL is not already running locally, you can use the included Docker fallback:

```powershell
docker compose up -d postgres
```

Credentials in the compose file match your request:

- user: `postgres`
- password: `5688353`
- database: `marketscan360`

## Current blockers in this machine session

- Python is not installed on this machine, so I could not start FastAPI yet.
- `psql` is not on PATH, so I could not verify an existing local PostgreSQL installation from terminal.
- frontend packages are not installed yet, so I could not run the Vite build in this session.

## Next build step

Once Python and dependencies are installed, the next high-value step is to replace the seeded demo services with live scrapers, background jobs, and true PDF generation.
