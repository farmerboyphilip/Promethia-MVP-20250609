# Prometheia MVP

## Development

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```
In another terminal:
```bash
cd frontend && npm install && npm run dev
```
Open <http://localhost:5173> in your browser.
