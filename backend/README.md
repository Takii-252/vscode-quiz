# Backend (FastAPI)

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn backend.main:app --reload
```

## Main Endpoints

- `GET /api/questions/next?os=mac&level=1&category=search`
- `POST /api/questions/judge`
- `GET /api/questions/{questionId}/hint?step=1&os=mac`
- `POST /api/results`
- `GET /api/review/weakness`

