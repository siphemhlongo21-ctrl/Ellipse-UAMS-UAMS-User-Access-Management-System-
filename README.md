# Ellipse User Access Management System (EUAMS)

A full-stack web application built for **eThekwini Municipality – Energy Unit** to manage and audit user access to the **Ellipse** enterprise asset management system.

It replaces a manual, email-driven access request process with a governed digital workflow: requests are captured, routed through the correct approvers, implemented by system administrators, and fully audited — with automatic expiry monitoring for contractor access.

> **Note:** This is a portfolio snapshot of a real production project I developed. Environment-specific configuration has been removed or redacted.

---

## Key Features

- **Access request workflow** – New, modify, revoke and reinstate access requests with multi-stage approvals (line manager → system owner → implementer)
- **Contractor onboarding** – Dedicated contractor request form with company details, contract periods, and supporting documents
- **Role & permission management** – Fine-grained, permission-code-based authorisation with admin UI to manage roles, permissions and user assignments
- **Document management** – Upload, view and audit supporting documents (stored via MinIO object storage or local file system)
- **Notifications** – In-app notification centre plus email notifications via the municipal email queue
- **Access expiry monitoring** – Background service that tracks contractor access expiry dates and sends reminders
- **Reporting dashboard** – Request volumes, turnaround times, status breakdowns and approver workload
- **Audit history** – Full status history and approver action trail on every request
- **POPIA compliance** – Consent modal and data handling aligned to the Protection of Personal Information Act
- **Employee directory integration** – Lookup of municipal employees from the HR (UST) directory

---

## Tech Stack

### Backend
- **.NET / ASP.NET Core Web API** (C#)
- **Entity Framework Core** with code-first migrations
- **SQL Server** (multiple DbContexts: EUAMS, HR directory, email queue)
- **JWT authentication** with custom permission-based authorisation policies
- **MinIO** S3-compatible object storage (with local file system fallback)
- **Hosted background services** for expiry reminders
- **Docker Compose** for local infrastructure

### Frontend
- **React 18 + TypeScript** with **Vite**
- **React Router** for routing and protected routes
- **CSS Modules + Tailwind** with a custom design-token theme
- Typed API client generated from the backend **OpenAPI** specification
- **Nginx** for production hosting

### DevOps
- Azure DevOps Git + Azure Pipelines CI/CD (pipeline config excluded from this snapshot)

---
## Solution Structure

```text
.
├── Backend/
│   ├── EUAMS.API/                     # ASP.NET Core Web API
│   │   ├── Controllers/               # API endpoints
│   │   ├── MiddleWare/                # JWT middleware
│   │   ├── Security/                  # Authorization policies
│   │   ├── Program.cs                 # Application startup/configuration
│   │   └── EUAMS.API.csproj
│   │
│   ├── EUAMS.Core/                    # Business logic and application services
│   │   ├── Extensions/
│   │   ├── Lookups/
│   │   ├── Notifications/
│   │   ├── Reports/
│   │   ├── Security/
│   │   ├── Services/
│   │   ├── Storage/
│   │   └── Workflow/
│   │
│   ├── EUAMS.Data/                    # Data access layer
│   │   ├── Entities/
│   │   ├── Migrations/
│   │   ├── Views/
│   │   └── EuamsDbContext.cs
│   │
│   ├── EUAMS.Shared/                  # Shared contracts and models
│   │   ├── DTOs/
│   │   ├── Enums/
│   │   ├── Interfaces/
│   │   └── Security/
│   │
│   └── EUAMS.slnx                     # .NET solution file
│
├── Frontend/
│   ├── src/
│   │   ├── api/                       # API clients and service calls
│   │   ├── app/                       # API bridge and application integration
│   │   ├── assets/                    # Static project assets
│   │   ├── components/                # Reusable UI components
│   │   ├── context/                   # Authentication/application state
│   │   ├── layout/                    # Application shell, sidebar, top bar
│   │   ├── pages/                     # Application pages and views
│   │   ├── styles/                    # Global styles and design tokens
│   │   ├── types/                     # TypeScript models and types
│   │   └── utilities/                 # Shared helpers and authorization utilities
│   │
│   ├── public/                        # Public static assets
│   ├── package.json                   # Frontend dependencies and scripts
│   └── vite.config.ts                 # Vite configuration
│
├── BRS/                               # Business requirements and project documentation
├── README.md                          # Project overview
└── .gitignore                         # Git ignore rules
```

## Architecture Highlights

- **Clean layering** – API → Core (services) → Data (EF Core), with Shared DTOs/interfaces to keep contracts explicit
- **Permission-based authorisation** – `[HasPermission("...")]` attributes backed by a custom `IAuthorizationHandler`, so access rules live in the database rather than hard-coded roles
- **Workflow writer** – Centralised `RequestWorkflowWriter` records every status transition and approver action for auditability
- **Pluggable storage** – `IObjectStorage` abstraction with MinIO and local-disk implementations
- **Frontend API bridge** – Mapper layer translates OpenAPI response shapes into UI view models, isolating the UI from backend changes

---

## Running Locally

### Prerequisites
- .NET 10.0
- Node.js 20+
- SQL Server (or Docker)
- Docker Desktop (optional, for MinIO)

### Backend
```bash
cd Backend
docker compose up -d                      # SQL Server + MinIO
dotnet ef database update --project EUAMS.Data --startup-project EUAMS.API
dotnet run --project EUAMS.API

Update Backend/EUAMS.API/appsettings.Development.json with your own connection string, JWT secret and storage settings.

cd Frontend
npm install
npm run dev

My Role
I developed this system end-to-end: requirements analysis with the Energy Unit, database design, backend API, frontend application, and CI/CD pipeline setup on Azure DevOps.

Screenshots
Coming soon

Author
Siphesihle Mhlongo
GitHub: @siphemhlongo21-ctrl


