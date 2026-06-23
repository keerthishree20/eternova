# Skill: Run Eternova

## Description
Start the Eternova development servers (backend + frontend) for local development and testing.

## Steps

### 1. Start Backend
```bash
cd /home/harikishan/KEERTHISHREE/dev/eternova/backend
source venv/bin/activate
uvicorn main:app --port 8001 --reload &
```

### 2. Start Frontend
```bash
cd /home/harikishan/KEERTHISHREE/dev/eternova/frontend
npm run dev -- -p 3000 &
```

### 3. Verify
```bash
# Backend health
curl http://localhost:8001/health
# Frontend
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

### 4. Open
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

## Notes
- Backend requires Python 3.11 venv at `backend/venv/`
- Frontend requires `npm install` if `node_modules/` is missing
- Backend auto-creates SQLite DB on first run
- If port is busy: `fuser -k 8001/tcp` or `fuser -k 3000/tcp`
- If `.next` cache is stale: `rm -rf frontend/.next`
