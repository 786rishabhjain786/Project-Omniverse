# 🌌 Project Omniverse

> **A distributed, polyglot media intelligence platform orchestrated with Docker Compose.**

Project Omniverse is an end-to-end distributed system that processes media ingestion jobs asynchronously across multiple specialized runtimes: Next.js (React), Node.js (TypeScript), .NET 8 (C#), and Python (FastAPI), backed by Redis, PostgreSQL, and MongoDB.

---

## 🏛️ System Architecture

[ Next.js 14 Web Client ]  (Port 3000)
            │  HTTP REST (Enqueue Job)
            ▼
[ Node.js API Gateway ]     (Port 5000)
     │            │
     │            ├──► Persists initial job status ('QUEUED') in [ PostgreSQL ] (Port 5432)
     │
     ▼ LPUSH
[ Redis Queue: media_jobs ] (Port 6379)
     │
     ▼ RPOP (Async Consumer Loop)
[ C# .NET 8 Media Worker ]
     │
     ▼ HTTP POST /api/v1/analyze
[ Python FastAPI AI Engine ] (Port 8000)
     │
     ▼ Returns Video/Audio ML Telemetry
[ C# .NET 8 Media Worker ]
     │
     ▼ HTTP POST /api/jobs/{id}/complete
[ Node.js API Gateway ]
     │
     ├──► Updates status to 'COMPLETED' in [ PostgreSQL ]
     └──► Stores raw inference telemetry in [ MongoDB ] (Port 27017)

---

## 🚀 Tech Stack

| Component | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 14, React, Tailwind CSS | Real-time dashboard to dispatch jobs and inspect status |
| **API Gateway** | Node.js, Express, TypeScript | Request orchestration, queue dispatch, database access |
| **Media Worker** | C# .NET 8 (BackgroundService) | High-throughput queue polling and media demux simulation |
| **AI Microservice** | Python 3.11, FastAPI, Pydantic | Vision & speech inference heuristics and metadata extraction |
| **Message Broker** | Redis 7 (Alpine) | In-memory decoupled job queuing (media_jobs) |
| **Relational DB** | PostgreSQL 15 (Alpine) | ACID-compliant tracking for job entities and lifecycles |
| **Document DB** | MongoDB 6.0 | Flexible NoSQL storage for deep AI telemetry payloads |
| **Orchestration** | Docker & Docker Compose | Containerized bridge networking and isolated services |

---

## 📋 Prerequisites

Before running the project, make sure you have:
- Docker Desktop installed and running (with WSL2 backend enabled on Windows).
- At least 10–15 GB of free disk space.

---

## ⚡ Quick Start: How to Run

### 1. Clone the Repository
git clone https://github.com/<your-username>/project-omniverse.git
cd project-omniverse

### 2. Build & Launch All Containers
docker compose up -d --build

### 3. Verify Container Status
docker compose ps
(All 7 containers should display status Up or Healthy)

---

## 🖥️ How to Use

### 1. Open the Web Dashboard
Navigate to http://localhost:3000 in your browser.

### 2. Dispatch a Media Job
1. Enter a media title in the input box (e.g. keynote_speech_2026.mp4).
2. Select the media type (video/mp4 or audio/wav).
3. Click Dispatch Job.

### 3. Watch the Real-Time Event Stream
Run this command in terminal to monitor the background worker:
docker compose logs -f media-worker

---

## 🔍 Database Inspection Commands

### Check PostgreSQL (Relational Status)
docker compose exec postgres psql -U omniverse -d omniverse_db -c "SELECT id, title, status, created_at, updated_at FROM media_jobs;"

### Check MongoDB (Raw AI Telemetry)
docker compose exec mongo mongosh -u omniverse -p omni_pass --authenticationDatabase admin --eval "use omniverse_telemetry; db.telemetries.find().pretty();"

---

## 🛑 How to Stop or Reset

### Stop all running containers:
docker compose down

### Reset everything (including database volumes):
docker compose down -v