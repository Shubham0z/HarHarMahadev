# 🚀 AI Supply Chain Disruption Prediction Platform

> **Predict. Prevent. Optimize.** — Powered by Multi-Agent AI & Real-Time Intelligence

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![n8n](https://img.shields.io/badge/n8n-Multi--Agent_Workflow-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)](https://n8n.io/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

---

## 📌 Overview

**Supply-chaina-ai** is a full-stack, enterprise-grade **AI-powered supply chain disruption prediction platform** built for large-scale logistics and procurement operations. It leverages a **6-agent n8n multi-agent orchestration system** backed by real-time weather, news, and route APIs to predict risks, find optimal suppliers, calculate costs, and recommend the best logistics decisions — all in one intelligent platform.

The platform includes a feature-rich **React + TypeScript frontend**, a **role-based access control system**, a **Manager Portal** for administrative oversight, and a **DeepGuard AI Chatbot** for interactive supply chain assistance.

---

## 🧠 Multi-Agent Architecture (n8n Backend)

The core intelligence of DeepGuard runs on an **n8n workflow** with **6 specialized AI agents** that execute in a strict sequential pipeline:

```
User Input (City + Product)
│
▼
┌─────────────────────┐
│   1. Demand Agent   │ ← Analyzes sales_data.csv (25,000+ rows)
│                     │   Forecasts demand trends & seasonal patterns
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│   2. Risk Agent     │ ← Pulls live News API + OpenWeather API
│                     │   Detects geopolitical, weather & supply risks
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 3. Logistics Agent  │ ← Queries OpenRoute / TomTom Maps API
│                     │   Computes best route, distance & ETA
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  4. Supplier Agent  │ ← Scans supplier_data.csv
│                     │   Finds best supplier by quality & location
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│   5. Cost Agent     │ ← Calculates full cost breakdown
│                     │   Transport + Supplier + Risk-adjusted pricing
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│   6. Boss Agent     │ ← Orchestrator / Final Decision Maker
│                     │   Synthesizes all agents → Final recommendation
└─────────────────────┘
          │
          ▼
Result → Supabase DB + Frontend Display
```

| Agent | Data Source | Output |
|-------|-------------|--------|
| **Demand Agent** | `sales_data.csv` (25K+ rows) | Demand forecast & trend analysis |
| **Risk Agent** | News API + OpenWeather API | Risk score, disruption alerts |
| **Logistics Agent** | TomTom Maps / OpenRoute API | Best route, distance, ETA |
| **Supplier Agent** | `supplier_data.csv` | Top supplier recommendation |
| **Cost Agent** | Internal pricing model | Full cost breakdown (₹) |
| **Boss Agent** | All agent outputs | Final go/no-go recommendation |

> **Webhook Entry Point:** `POST /webhook/deepguard-analyze`
> **Chatbot Webhook:** `POST /webhook/deepguard-chat`

---

## 🗂️ Project Structure

```
Supply chain/
│
├── 📁 frontend/                          # React + Vite + TypeScript + Tailwind
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── Layout.tsx                # Main layout (Navbar + Sidebar for users)
│   │   │   ├── ManagerLayout.tsx         # Left sidebar layout for Manager portal
│   │   │   ├── ChatBot.tsx               # DeepGuard AI floating chatbot
│   │   │   ├── KPICard.tsx               # Reusable KPI metric card
│   │   │   └── ProtectedRoute.tsx        # Auth guard for role-based access
│   │   │
│   │   ├── 📁 pages/
│   │   │   ├── HomePage.tsx              # Landing page
│   │   │   ├── DashboardPage.tsx         # KPI overview dashboard
│   │   │   ├── AnalyzePage.tsx           # Run AI supply chain analysis
│   │   │   ├── RoutesPage.tsx            # Route visualization & optimization
│   │   │   ├── RiskPage.tsx              # Real-time risk monitoring
│   │   │   ├── SuppliersPage.tsx         # Supplier discovery & comparison
│   │   │   ├── ReportsPage.tsx           # Historical reports from Supabase
│   │   │   ├── ScenarioPage.tsx          # What-if scenario simulation
│   │   │   ├── LoginPage.tsx             # User authentication
│   │   │   ├── SignupPage.tsx            # User registration
│   │   │   │
│   │   │   ├── ManagerAuthPage.tsx       # Manager-only login page
│   │   │   ├── ManagerDashboardPage.tsx  # Manager overview + charts
│   │   │   ├── ManagerPerformancePage.tsx# Agent & system performance
│   │   │   ├── ManagerUsersPage.tsx      # User management & permissions
│   │   │   └── ManagerDataWarehousePage.tsx # Raw Supabase table viewer
│   │   │
│   │   ├── 📁 lib/
│   │   │   ├── api.ts                    # API calls to n8n webhooks
│   │   │   ├── supabase.ts               # Supabase client configuration
│   │   │   └── constants.ts              # Cities, products, config values
│   │   │
│   │   ├── App.tsx                       # Route definitions
│   │   ├── main.tsx                      # Entry point
│   │   └── index.css                     # Global styles + Tailwind imports
│   │
│   ├── .env                              # Environment variables
│   ├── vite.config.ts                    # Vite configuration
│   ├── tailwind.config.ts                # Tailwind configuration
│   └── tsconfig.json
│
├── 📁 n8n-workflows/
│   └── deepguard-main-workflow.json      # Exported n8n workflow
│
└── README.md
```

---

## 🖥️ Frontend Pages

### 👤 User-Facing Pages

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Landing page with platform overview, features, and CTA |
| **Dashboard** | `/dashboard` | Real-time KPI cards, charts, recent analysis summary |
| **Analyze** | `/analyze` | Select city + product → trigger n8n pipeline → view full AI result |
| **Routes** | `/routes` | Interactive route map with distance, ETA, transport mode SVGs |
| **Risk** | `/risk` | Live risk monitoring — weather alerts, news disruptions, risk scores |
| **Suppliers** | `/suppliers` | Supplier leaderboard with quality scores, city, and risk badges |
| **Reports** | `/reports` | All past analyses pulled from Supabase with filters |
| **Scenario** | `/scenario` | What-if simulations — adjust variables and predict outcomes |
| **Login** | `/login` | User sign-in with Supabase Auth |
| **Signup** | `/signup` | New user registration |

### 🛡️ Manager Portal (Protected — Separate Auth)

| Page | Route | Description |
|------|-------|-------------|
| **Manager Auth** | `/manager` | Manager-only login (separate from user auth) |
| **Manager Dashboard** | `/manager/dashboard` | Full overview: agent results, cost donut, radar chart, risk gauge, demand timeline |
| **Manager Performance** | `/manager/performance` | Agent performance metrics, active analyses, system health |
| **Manager Users** | `/manager/users` | View all users, assign/revoke page-level permissions |
| **Manager Data Warehouse** | `/manager/datawarehouse` | Browse raw Supabase tables — analyses, suppliers, stock, transfers |

> All manager pages share a **left sidebar** (`ManagerLayout.tsx`), completely separate from the user-facing `Layout.tsx`.

---

## 🗄️ Database Schema (Supabase / PostgreSQL)

```sql
analyses           -- Every analysis run: city, product, result JSON, timestamp
suppliers          -- Supplier master data: name, city, quality score, risk level
cost_breakdowns    -- Cost details per analysis run
risk_alerts        -- Live risk alerts linked to analyses
warehouse_stock    -- Real-time warehouse inventory
stock_transfers    -- Transfer logs between warehouse locations
users              -- Registered users with roles and page permissions
```

> Row Level Security (RLS) is enabled — users only access their own data; managers have full read access.

---

## 🔐 Authentication & Role-Based Access Control

Supply chain uses a **two-tier auth system**:

### User Auth (Supabase Auth)
- Sign up / Login via Supabase Auth
- Each user has a `permissions` object stored in the database
- `ProtectedRoute.tsx` checks permissions before rendering any page
- Navbar dynamically shows only the pages the user has been granted access to

### Manager Auth (Separate)
- Managers log in via `/manager` with a separate credential check
- Access the Manager Portal via `ManagerLayout.tsx` left sidebar
- Managers can grant or revoke page-level access to any user from `ManagerUsersPage`

```
User visits /risk
      │
      ▼
ProtectedRoute checks permissions['risk'] === true
      │
   ✅ Yes → Render RiskPage
   ❌ No  → Redirect with "Access Denied"
```

---

## 🤖 DeepGuard AI Chatbot

A floating chatbot widget is embedded on every page (bottom-right corner).

| Property | Value |
|----------|-------|
| **Name** | Supply-chain AI Assistant |
| **Powered by** | n8n AI Agent via webhook |
| **Webhook** | `POST https://chandn8n.app.n8n.cloud/webhook/supply-chain-chat` |
| **Style** | Orange/white gradients, glassmorphism — matches platform design |
| **Capability** | Answers supply chain questions, explains results, provides smart suggestions |

---

## 🔌 API Integrations

| Service | Purpose |
|---------|---------|
| **Google Gemini 2.0 Flash** | LLM backbone for all 6 agents |
| **News API** | Live headlines for disruption detection |
| **OpenRoute API** | Alternate routing for logistics agent |
| **Supabase** | Database, Auth, real-time storage |

---

## 🚀 Getting Started

### Prerequisites
- n8n Cloud account (or self-hosted)
- Supabase project
- API Keys: Gemini, News API

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/deepguard-supply-chain.git
cd deepguard-supply-chain

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Setup environment variables
cp .env.example .env
```

### Environment Variables

```text
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_KEY=your_supabase_service_role_key
VITE_N8N_WEBHOOK_URL=https://aakan8n.app.n8n.cloud/webhook/supplychain/analyze
VITE_N8N_CHATBOT_URL=https://chandn8n.app.n8n.cloud/webhook/supply-chain-chat
```

### Run Locally

```bash
npm run dev
# Runs on http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## ☁️ Deployment

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting (React + Vite) |
| **n8n Cloud** | Multi-agent workflow backend |
| **Supabase** | Managed PostgreSQL + Auth |
| **Render** | FastAPI/Python microservice |

---

## 📊 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 18 + Vite 5 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 3 |
| **Routing** | React Router DOM v6 |
| **Icons** | Lucide React |
| **Backend / Orchestration** | n8n (Multi-Agent Workflow) |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth + Custom Manager Auth |
| **AI / LLM** | Google Gemini 2.0 Flash |
| **Maps & Routes** | TomTom Maps API / OpenRoute API |
| **Weather Data** | OpenWeather API |
| **News Intelligence** | News API |
| **Deployment** | Vercel + n8n Cloud + Supabase |

---

## 🛠️ Developer Notes

- All analysis results are auto-saved to Supabase after every `runAnalysis()` call from `AnalyzePage`
- `ManagerLayout.tsx` wraps all `/manager/*` routes with a left sidebar — independent of `Layout.tsx`
- Transport mode icons are dynamically rendered as inline SVGs — supports Air ✈️, Ship 🚢, Truck 🚛, Train 🚂, Bike 🏍️, Van 🚐, Drone, Ferry + unknown fallback
- Risk gauge on Manager Dashboard uses a CSS semicircle with dynamic needle for LOW / MEDIUM / HIGH
- `ProtectedRoute.tsx` guards every user page; manager pages use a separate session check

---
git add