@echo off

echo Starting Backend...

start cmd /k "cd server && venv\Scripts\activate && alembic upgrade head && python -m app.utils.seed && uvicorn app.main:app --reload"

echo Starting Frontend...

start cmd /k "cd client && npm run dev"