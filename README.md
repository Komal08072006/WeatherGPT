# WeatherGPT

WeatherGPT is a full-stack weather intelligence web application powered by React + Vite on the frontend and FastAPI on the backend.

## Project Structure

```text
WeatherGPT/
├── frontend/             # React + Vite frontend application
│   ├── src/              # React source code (App.jsx, index.css, main.jsx)
│   ├── index.html        # HTML entry point
│   ├── package.json      # Node.js dependencies and scripts
│   └── vite.config.js    # Vite configuration
├── backend/              # FastAPI Python backend service
│   ├── main.py           # FastAPI app entry point & server runner
│   └── requirements.txt  # Python package dependencies
├── .gitignore            # Git ignore configuration
└── README.md             # Project documentation
```

## Getting Started

### 1. Prerequisites
- **Node.js**: v18+ and `npm`
- **Python**: v3.9+ and `pip`

---

### 2. Backend Setup (FastAPI)

Navigate to the `backend` directory:

```bash
cd backend
```

(Optional) Create and activate a Python virtual environment:

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the backend server:
```bash
python main.py
```

The FastAPI backend will start running at:
`http://127.0.0.1:8000`

Interactive API docs available at:
`http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup (React + Vite)

Navigate to the `frontend` directory:

```bash
cd frontend
```

Install Node dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

The React frontend will be accessible at the URL printed in the terminal (typically `http://localhost:5173`).

---

## API Endpoints

- `GET /`: Health check endpoint returning `{"message": "WeatherGPT Backend is running"}`
