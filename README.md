<div align="center">

# ♻️ WASTEFLOW

### **Galle District Solid Waste Operations & Monitoring System**

<p>
  <img src="https://img.shields.io/badge/Status-Portfolio%20Prototype-7C3AED?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/React-TypeScript-06B6D4?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Express-22C55E?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
</p>

<p>
  <a href="https://kavigamage-da.github.io/wasteflow/">
    <img src="https://img.shields.io/badge/🚀%20LIVE%20DEMO-Open%20WasteFlow-8B5CF6?style=for-the-badge" alt="Live Demo">
  </a>
  &nbsp;
  <a href="https://github.com/kavigamage-da/wasteflow">
    <img src="https://img.shields.io/badge/Source-GitHub-18181B?style=for-the-badge&logo=github" alt="GitHub">
  </a>
</p>

<p>
  <strong>Turning fragmented waste operations into a traceable, measurable workflow.</strong>
</p>

<br>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:7C3AED,50:06B6D4,100:22C55E&height=120&section=header" width="100%"/>

</div>

---

## 🎯 The Problem

Solid-waste operations involve multiple stages:

**Collection → Transport → Receiving → Processing → Transfer / Disposal → Reporting**

When operational information is fragmented across different records and workflows, it becomes harder to answer basic management questions:

* Where did a load originate?
* How much material was declared?
* How much was actually received?
* Where did the received material go?
* Were there quantity variances?
* Which operational exceptions require attention?
* Can management trace a load across its complete lifecycle?

**WasteFlow** explores how a centralized digital workflow could connect these operational stages through common identifiers, reconciliation rules, dashboards, exception handling, and traceability.

---

## ✨ What WasteFlow Demonstrates

<div align="center">

|    🔄 Operations   |     📊 Analytics    |  🔎 Traceability | 🛡️ Governance |
| :----------------: | :-----------------: | :--------------: | :------------: |
| Collection & Trips |   Operational KPIs  |   Load Tracking  |      RBAC      |
|   Load Management  |       Reports       | Chain of Custody |   Audit Logs   |
|      Receiving     | Executive Dashboard | Movement History |   Validation   |
|     Processing     |    Trend Analysis   |  Reconciliation  |   Exceptions   |

</div>

---

## 🚀 Live Demo

### **[→ Open WasteFlow Live Demo](https://kavigamage-da.github.io/wasteflow/)**

The public demo runs as a frontend portfolio demonstration using **synthetic data**.

### Demo Accounts

| Role                          | Username     | Password        |
| ----------------------------- | ------------ | --------------- |
| 🚚 Driver                     | `driver`     | `driver123`     |
| 👥 Collection Supervisor      | `supervisor` | `super123`      |
| 🏭 Facility Receiving Officer | `receiving`  | `receiving123`  |
| ♻️ Processing Officer         | `processing` | `processing123` |
| 📋 Officer                    | `officer`    | `officer123`    |
| 🛡️ Administrator             | `admin`      | `admin123`      |

> **Demo credentials are intentionally provided for portfolio evaluation.**

---

## 🧭 Explore the Workflow

```text
┌──────────────┐
│  COLLECTION  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  TRANSPORT   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  RECEIVING   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PROCESSING  │
└──────┬───────┘
       │
       ├───────────────┐
       ▼               ▼
┌──────────────┐  ┌──────────────┐
│   TRANSFER   │  │   DISPOSAL   │
└──────┬───────┘  └──────┬───────┘
       │                  │
       └────────┬─────────┘
                ▼
       ┌─────────────────┐
       │    REPORTING    │
       └─────────────────┘
```

Every major operational stage is connected through a shared digital workflow rather than being treated as an isolated screen.

---

# 📦 Core Modules

### 📊 Dashboard

A centralized operational view containing:

* Key operational indicators
* Load statistics
* Processing information
* Exceptions
* Recent activity
* Trend visualizations

---

### 🚛 Trips

Track collection and transportation activities through:

* Trip records
* Vehicle information
* Driver information
* Collection activity
* Operational status
* Trip history

---

### ⚖️ Loads

Manage the movement of waste using a consistent **Load ID**.

Key concepts include:

* Declared quantity
* Received quantity
* Variance
* Processing allocation
* Transfer allocation
* Completion status

---

### 🏭 Receiving

The receiving stage connects transportation with facility operations.

The system demonstrates:

```text
Declared Weight
      ↓
Received Weight
      ↓
Variance Calculation
      ↓
Reconciliation
      ↓
Operational Status
```

---

### ♻️ Processing

Track how received material is allocated into processing outcomes such as:

* Compost
* Landfill
* Other processing destinations

---

### 🚚 Transfers

Track material leaving the facility through transfer operations.

---

### 🔗 Traceability

The traceability module connects the lifecycle of a load:

```text
Load ID
   ↓
Trip
   ↓
Collection
   ↓
Receiving
   ↓
Processing
   ↓
Transfer / Disposal
```

This creates a single operational story around a load instead of disconnected records.

---

### 📈 Reports

Provide analytical views for:

* Operational activity
* Loads
* Quantities
* Processing
* Transfers
* Exceptions
* Reconciliation

---

### ⚠️ Exceptions

Highlight operational conditions that require attention, such as:

* Quantity variances
* Incomplete records
* Reconciliation issues
* Workflow exceptions

---

### 🧾 Audit Logs

Record important system activities to support operational accountability and traceability.

---

### 🧠 Executive Dashboard

A higher-level view designed around management questions:

> **What is happening?**

> **Where are the exceptions?**

> **How much material moved through the system?**

> **Where should attention be directed?**

---

# 🧪 Golden Demonstration Scenario

WasteFlow includes a consistent synthetic demonstration scenario:

### `LD-DEMO-001`

| Metric          |         Value |
| --------------- | ------------: |
| Declared        |  **2,600 kg** |
| Received        |  **2,550 kg** |
| Variance        |     **50 kg** |
| Compost         |  **1,700 kg** |
| Landfill        |    **650 kg** |
| Transfer        |    **200 kg** |
| Total Allocated |  **2,550 kg** |
| Unaccounted     |      **0 kg** |
| Status          | **COMPLETED** |

### Reconciliation Logic

```text
Received
  2,550 kg
      │
      ├── Compost ────── 1,700 kg
      │
      ├── Landfill ─────── 650 kg
      │
      └── Transfer ─────── 200 kg
                         ───────
                          2,550 kg

Unaccounted = 0 kg
```

This scenario demonstrates how WasteFlow can connect **receiving → processing → transfer** while maintaining quantity reconciliation.

---

# 🏗️ System Architecture

```text
                    ┌─────────────────────────┐
                    │      WasteFlow Web      │
                    │   React + TypeScript    │
                    │    Vite + Recharts      │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      REST API Layer     │
                    │   Node.js + Express     │
                    │      JWT + Zod          │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       PostgreSQL        │
                    │   Operational Database  │
                    └─────────────────────────┘
```

### Portfolio Demo Architecture

The public GitHub Pages version uses a frontend demo mode so the interface can be explored without requiring the separate backend and database to be running.

```text
PUBLIC DEMO

Browser
   │
   ▼
React / Vite
   │
   ▼
Demo Data Layer
   │
   └── Synthetic Dataset
```

The backend architecture remains available for local/full-stack development.

---

# 🛠️ Technology Stack

### Frontend

![React](https://img.shields.io/badge/React-2026-61DAFB?style=flat-square\&logo=react\&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square\&logo=typescript\&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=flat-square\&logo=vite\&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-Visualization-8884D8?style=flat-square)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square\&logo=node.js\&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-black?style=flat-square)
![Zod](https://img.shields.io/badge/Validation-Zod-3E67B1?style=flat-square)

### Database

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square\&logo=postgresql\&logoColor=white)

### Development

![Git](https://img.shields.io/badge/Git-Version%20Control-F05032?style=flat-square\&logo=git\&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF?style=flat-square\&logo=githubactions\&logoColor=white)

---

# 🔐 Security & Governance Concepts

WasteFlow demonstrates security and governance concepts including:

* Role-based access control
* JWT-based authentication architecture
* Password hashing
* Input validation
* API request validation
* Audit logging
* Role-aware navigation
* Operational exception handling
* Controlled workflow transitions

These are demonstrated as **prototype architecture and implementation concepts**, not as certification or production-security claims.

---

# 👥 Role Model

```text
                    ┌───────────────┐
                    │     ADMIN     │
                    └───────┬───────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
       SUPERVISOR       OFFICER       OPERATIONS
                                          │
                         ┌────────────────┼───────────────┐
                         ▼                ▼               ▼
                      DRIVER          RECEIVING        PROCESSING
```

Each role represents a different operational responsibility within the proposed workflow.

---

# 📁 Repository Structure

```text
wasteflow/
│
├── backend/
│   ├── src/
│   ├── tests/
│   └── ...
│
├── web-dashboard/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── database/
│   └── ...
│
├── api/
│   └── ...
│
├── docs/
│   └── ...
│
└── README.md
```

---

# 🔄 Development Approach

WasteFlow was designed around a workflow-first approach:

```text
01  DISCOVER
     ↓
02  DEFINE
     ↓
03  MODEL
     ↓
04  PRIORITIZE
     ↓
05  DESIGN
     ↓
06  BUILD
     ↓
07  VALIDATE
     ↓
08  IMPROVE
```

The goal is not simply to build screens, but to connect:

**Business Process → Data → Workflow → Controls → Analytics**

---

# 📊 Key Design Principles

### 01 — Traceability First

Every important operational movement should be connected to an identifiable record.

### 02 — Reconciliation

Declared, received, processed, transferred, and remaining quantities should be logically reconcilable.

### 03 — Exception Visibility

Problems should become visible rather than disappearing inside disconnected records.

### 04 — Role Awareness

Different operational responsibilities should have appropriate system access.

### 05 — Decision Support

Dashboards should answer operational and management questions rather than simply display data.

### 06 — Evidence-Based Design

The prototype distinguishes between verified information, assumptions, and proposed system capabilities.

---

# 🧩 Business Analysis Perspective

WasteFlow is also a **Business Analysis / Product Thinking case study**.

The project explores:

| BA Area              | WasteFlow Application              |
| -------------------- | ---------------------------------- |
| Problem Analysis     | Fragmented operational information |
| Stakeholder Thinking | Multiple operational roles         |
| Process Analysis     | Collection → Reporting             |
| Requirements         | Functional & non-functional needs  |
| Data Analysis        | Quantity and operational metrics   |
| Business Rules       | Reconciliation & workflow rules    |
| Exception Management | Variance & operational issues      |
| Product Thinking     | Role-specific workflows            |
| Decision Support     | Executive dashboards               |
| Validation           | Synthetic scenario testing         |

---

# 📚 Evidence Boundary

WasteFlow is intentionally separated into three categories:

### 🟢 Verified

Information supported by available public documentation or project evidence.

### 🟡 Unverified

Operational details that would require direct validation with relevant authorities or stakeholders.

### 🔵 Proposed

Features, workflows, dashboards, and digital capabilities designed as part of this prototype.

This distinction is important because **WasteFlow is a proposed portfolio system, not a claim that this software is currently deployed by a government institution.**

---

# ⚠️ Important Disclaimer

> **WasteFlow is a portfolio prototype / demonstration system.**
>
> It is **not an officially deployed government platform** and should not be interpreted as an existing operational system of a government authority.
>
> The public demonstration uses **synthetic data** for illustration and testing.
>
> Any real-world deployment would require stakeholder validation, requirements confirmation, security review, infrastructure assessment, data governance, and formal authorization.

---

# 🚀 Running Locally

### 1. Clone

```bash
git clone https://github.com/kavigamage-da/wasteflow.git
cd wasteflow
```

### 2. Frontend

```bash
cd web-dashboard
npm install
npm run dev
```

### 3. Backend

```bash
cd backend
npm install
npm run dev
```

Refer to the project documentation for the complete backend/database configuration.

---

# 🧪 Demo Journey

For the quickest evaluation:

```text
LOGIN
  ↓
DASHBOARD
  ↓
TRIPS
  ↓
LOADS
  ↓
RECEIVING
  ↓
PROCESSING
  ↓
TRANSFERS
  ↓
TRACEABILITY
  ↓
REPORTS
  ↓
EXCEPTIONS
  ↓
AUDIT LOGS
  ↓
EXECUTIVE
```

### Recommended starting account

```text
Username: admin
Password: admin123
```

Then explore the role-specific accounts to understand how the workflow changes across operational responsibilities.

---

# 🎥 Product Walkthrough

<div align="center">

### From collection to decision support

**COLLECT**
↓
**TRANSPORT**
↓
**RECEIVE**
↓
**RECONCILE**
↓
**PROCESS**
↓
**TRANSFER**
↓
**TRACE**
↓
**ANALYZE**
↓
**DECIDE**

</div>

---

# 🌐 Links

<div align="center">

### 🚀 Live Application

**[Open WasteFlow Demo](https://kavigamage-da.github.io/wasteflow/)**

### 💻 Source Code

**[View Repository](https://github.com/kavigamage-da/wasteflow)**

### 👤 Portfolio

**[Kavindi Gamage](https://github.com/kavigamage-da)**

</div>

---

# 👤 Project

**Kavindi Gamage**

BA (Hons) Information Technology
University of Ruhuna, Sri Lanka

**Focus Areas**

`Business Analysis` · `Data Analytics` · `Product Thinking` · `Front-End Development` · `AI/ML`

---

<div align="center">

### Built to explore a simple idea:

# **Better data → Better visibility → Better decisions**

<br>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:22C55E,50:06B6D4,100:7C3AED&height=120&section=footer" width="100%"/>

**WasteFlow · Portfolio Demonstration · Synthetic Data**

</div>
