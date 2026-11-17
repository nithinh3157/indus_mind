# INDUSMIND
### Intelligent Multi-Industry Manufacturing Management & Predictive Analytics Platform

INDUSMIND is a unified industrial intelligence platform integrating **AutoForge** (Automobile Manufacturing) and **DairyFlow** (Dairy Manufacturing) under one shared authentication session, navigation shell, calculation engine, and FastAPI-ready service adapter.

---

## Core Architecture

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Recharts, React Router, Lucide Icons.
- **Web & AI Proxy Server (`server.ts`)**: Express server hosting Vite middleware in development, static `dist/` in production, and `POST /api/assistant/ask` for grounded Gemini queries (`@google/genai` using `gemini-4-hydrogen`).
- **Service Adapter (`src/services/indusmindApiService.ts`)**: Structured for seamless migration to a **Python FastAPI + MySQL** backend (`VITE_FASTAPI_BASE_URL`), with a deterministic local query engine over live application records.
- **Calculation Engine (`src/utils/calculations.ts`)**: Implements division-by-zero-safe industrial KPIs, non-double-counted financial & delay-loss attribution, and normalized cross-industry ratios.

---

## Integrated Modules & Features

1. **Overview Dashboard**: Unified plant summary, separated AutoForge vehicles vs DairyFlow litres, normalized cross-industry comparison, and priority alerts.
2. **AutoForge Module**: 7-stage pipeline (`Raw Material Supply` to `Quality Inspection`), vehicle/chassis order tracking, machine utilization, model-wise profitability, and Vehicle Surface Defect Image Upload workflow (clearly marked pending automated CV model integration).
3. **DairyFlow Module**: 7-stage processing (`Raw Milk Reception` to `Quality Inspection`) for Milk, Curd, Butter, Ghee, and Paneer; configurable thermal monitoring; batch traceability; cold storage vaults; and **Expert Temperature Verification with Image Evidence** (preserving original photos, audit trails, discrepancy checks, and human sign-off governance).
4. **Production & Bottleneck Intelligence**: Digital Factory pipeline view, What-If Capacity & Disruption Simulator (labeled hypothetical), and Bottleneck Constraint Diagnostics.
5. **Predictive Maintenance, Quality, Inventory, Finance, Energy, AI Assistant (`INDUSMIND AI`), Alerts, Reports (Excel CSV + Print/PDF), User Management, and Settings**.

---

## Running Locally (VS Code)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables (copy `.env.example` to `.env`):
   ```bash
   cp .env.example .env
   ```
   Optional: add `GEMINI_API_KEY` in `.env` if you want to test the Gemini AI mode inside `INDUSMIND AI` (Deterministic Data Query mode works offline without an API key).
3. Start the development server on port `3000`:
   ```bash
   npm run dev
   ```
4. Build and run production server:
   ```bash
   npm run build
   npm start
   ```

---

## Future FastAPI + MySQL Integration Path (Stage 7)

Point `src/services/indusmindApiService.ts` endpoints (`/api/v1/autoforge/*`, `/api/v1/dairyflow/*`, `/api/v1/analytics/*`, `/api/v1/finance/*`) to your local FastAPI server (`uvicorn main:app --reload --port 8000`) backed by MySQL tables for `factories`, `manufacturing_stages`, `machines`, `vehicle_orders`, `vehicle_defect_inspections`, `dairy_batches`, `temperature_verifications`, `inventory_items`, `financial_ledgers`, and `alerts`.
