# QMatch Lead Intelligence Engine

Welcome to the **QMatch Lead Intelligence Engine**, a specialized, purpose-built sales tool designed to help QMatch Consulting identify, qualify, and target the right businesses for consulting engagements in Poland and the broader CEE region.

## 🎯 The Goal
The primary objective of this application is to move away from generic lead-scraping and instead **intelligently identify companies experiencing structural debt or scaling inflection points**. 

Instead of just telling a sales rep *who* to contact, the engine tells them **why** this company needs QMatch right now, filtering out unqualified leads and generating a contextual, AI-driven explanation for the outreach strategy.

---

## ⚙️ How It Works (The Pipeline)

When data enters the system (via CSV import or mock data seeding), it rapidly passes through a 5-step qualification engine:

1. **Normalization & Deduplication**: Cleans up URLs, standardizes company names, and merges duplicate records securely.
2. **ICP Filtering**: Compares the lead's country, industry, employee count, and decision-maker roles against the QMatch Ideal Customer Profile.
3. **Signal Detection**: Scans the company data for critical business signals (e.g., "Founder-led with 50+ employees but no COO").
4. **Scoring**: Calculates a priority score out of 10 based on regional proximity, role relevance, and detected risk models.
5. **AI Synthesis**: Uses Anthropic's Claude 3 AI to read the signals and write a 2-3 sentence brief for the sales team explaining exactly *why* this company is a prime target for a consulting pitch.

---

## 📥 How to Set Inputs & Use the Tool

### 1. ICP Settings (The Filter Rules)
You can configure the strict rules of the engine directly from the **ICP Settings** tab in the UI.
- **Target Countries**: Defaults to Poland, Czech Republic, Romania, etc.
- **Target Industries**: Defaults to operationally complex industries (Manufacturing, Logistics, Retail, etc.).
- **Employee Range**: Sets the "sweet spot" for consulting (e.g., 20 - 500).
- **Target Roles**: Identifies the right decision-makers using both English and Polish titles (*Prezes, Właściciel, Founder, CEO*).

### 2. Importing Data
To process new leads, use the **Import CSV** workflow. The system expects a standard CSV exported from a tool like Apollo, LinkedIn Sales Navigator, or Lusha.
* **Auto-Mapping**: The tool will automatically guess the columns (Company Name, Website, Employees, etc.).
* **Growth Signals**: You can pass a comma-separated list of keywords representing recent news (e.g., "rapid hiring, new market").

### 3. Pipeline Workflow
Once loaded, companies land in the **Dashboard**. 
- Sales reps review leads starting from the `New` status. 
- Using the quick action buttons (✓ or ✗), reps move them to `Approved for Outreach` or `Rejected`.
- Leads eventually progress to `Contacted` and `Converted`.

### 4. Setting Environment Variables
To get the full power of the AI summaries, you must provide your API keys in the `backend/.env` file:
```env
# backend/.env

# Your Claude 3 API Key for AI Explanations
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxx...

# The Database Connection
# Note: Currently bypassed for a local 'mongomock' in-memory DB for quick testing.
# In production, set this to a real MongoDB URI:
MONGO_URL=mongodb://localhost:27017

DB_NAME=qmatch_lead_intelligence
CORS_ORIGINS=http://localhost:3000
```
> *Note: If `ANTHROPIC_API_KEY` is missing, the engine gracefully falls back to a smart, template-based explanation generator based on the detected signals.*

---

## 🧠 The Logic Engine Detailed Breakdown

To understand how the app judges leads, here are the core logical models operating in the backend:

### Signal Detection (`backend/signal_detection.py`)
The engine categorizes specific data patterns into "Typed Signals":
- **Scaling Signal**: Company has 50+ employees and is still strictly founder-led.
- **Risk Signal**: The company is growing (50+ employees) but lacks an Operations leader (COO/Dyrektor Operacyjny).
- **Structure Signal**: The company is in a complex industry (Logistics/Manufacturing) and has reached a size where informal management breaks down.

### The Scoring Algorithm (`backend/scoring.py`)
Every lead starts with a base score of 0, capped at 10. Points are awarded based on:
* **+3 pts**: High-level Polish/CEE decision maker role (Prezes, Właściciel, CEO).
* **+2 pts**: Standard management role (Dyrektor).
* **+1 pt**: Company is physically located in Poland (home market advantage).
* **+2 pts**: Detected 'Risk' signal (immediate need for organizational structure).
* **+1.5 pts**: Detected 'Scaling' or 'Structure' signal.
* **+1 pt**: Right employee count sweet spot.

---

## 📂 Project Structure

The codebase is split into a **React Frontend** and a **FastAPI/Python Backend**.

```text
tomek-main/
│
├── backend/                  # The Intelligence Engine
│   ├── server.py             # Main API Routing and endpoints
│   ├── models.py             # Pydantic data schemas (Lead structure)
│   ├── icp.py                # Logic for validating companies against ICP
│   ├── scoring.py            # The 1-10 scoring math
│   ├── signal_detection.py   # Pattern matching for business risks/growth
│   ├── ai_explanation.py     # Claude AI integration & prompt engineering
│   ├── mock_data.py          # 27 realistic CEE company profiles for testing
│   └── requirements.txt      # Python dependencies (FastAPI, Anthropic, etc.)
│
├── frontend/                 # The Sales Interface
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardPage.js   # The main pipeline interface & table
│   │   │   ├── ImportPage.js      # The CSV mapping workflow
│   │   │   └── SettingsPage.js    # The ICP configuration screen
│   │   ├── components/
│   │   │   ├── LeadDetailsSheet.js # The slide-out panel with AI explanations
│   │   │   ├── StatusBadges.js     # Color-coded UI badges for pipeline states
│   │   │   └── Layout.js           # QMatch branding, header, navigation
│   │   ├── lib/api.js              # Axios configuration for talking to backend
│   └── package.json          # Node dependencies (React, Tailwind, Radix UI)
```

## 🚀 Running Locally

1. **Start the Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn server:app --reload --port 8000
   ```
2. **Start the Frontend**:
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   npm start
   ```
This will launch the app at `http://localhost:3000`.
