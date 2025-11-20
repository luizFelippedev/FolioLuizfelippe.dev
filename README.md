# Portfolio Backend

Futuristic portfolio backend engineered with Node.js, Express, and TypeScript. It powers advanced features such as multi-tenant content management, analytics collection, real-time interactions, and AI-ready endpoints.

## ✨ Highlights
- **Modular architecture**: Domain-driven folders for controllers, services, validators, and models.
- **Type-safe**: Strict TypeScript configuration, Zod schemas, and runtime validation.
- **Secure by design**: JWT authentication, rate limiting, helmet, sanitized inputs, structured logging, and request correlation IDs.
- **Real-time ready**: Socket.IO gateway prepared for chat, notifications, and analytics streams.
- **Scalable integrations**: Redis cache (with in-memory fallback), Cloudinary/S3-ready upload layer, and SMTP email service.
- **Admin productivity**: Built-in pagination/sorting, CSV exports, newsletter scheduling, and aggregated metrics dashboards.

## 🚀 Getting Started

```bash
yarn install
yarn dev
```

The development server boots on `http://localhost:4000` by default. Environment variables are resolved through `.env.<env>` files with type-safe validation (`src/config/env.config.ts`).

## 📁 Key Directories
- `src/config` – Environment, database, cache, and external service configuration.
- `src/controllers` – Presentation layer orchestrating requests/responses.
- `src/services` – Business logic with domain-specific operations.
- `src/models` – Mongoose models for MongoDB collections.
- `src/middleware` – Cross-cutting concerns such as auth, validation, logging, and error handling.
- `src/utils` – Shared helpers (pagination, caching, CSV, error utilities), response formatters, and logger configuration.
- `src/routes` – API surface split by module and wired in `routes/index.ts`.

## 📊 Advanced Capabilities
- **Smart caching** – Declarative middleware backed by Redis (or in-memory fallback) with automatic cache busting on mutations.
- **Insightful analytics** – Activity logs for all admin mutations, real-time dashboard broadcasting, and REST metrics summaries.
- **Powerful exports** – Admin endpoints deliver newsletter subscriber and contact pipelines as downloadable CSV files.
- **Flexible list APIs** – Pagination, sorting, and filtering parameters standardised across projects, certificates, blog posts, and testimonials.
- **Prometheus metrics** – `/metrics` endpoint exposes default Node and HTTP instrumentation for scraping.

## 🚀 Deployment Playbook

| Concern | Recommendation |
| --- | --- |
| **MongoDB** | Use MongoDB Atlas or a managed cluster. Set `DATABASE_URL` with credentials + retry params. Enable SRV connection and IP allowlisting. |
| **Redis** | Required for distributed caching and rate-limiter persistence. A managed instance (Upstash, Redis Cloud) or a container (`redis:7-alpine`). Set `REDIS_URL` accordingly. Fallback to in-memory cache happens automatically in tests, but production should run a real instance. |
| **SMTP / Email** | Provide transactional email credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`) or an API-based provider. Configure `NOTIFICATION_EMAIL`, `NEWSLETTER_CONFIRMATION_URL`, and `PASSWORD_RESET_URL` with public HTTPS origins. |
| **Assets** | Configure Cloudinary/S3 creds when enabling upload persistence (`CLOUDINARY_*` or `AWS_*` variables). |
| **Environment files** | Duplicate `.env.example` into stage-specific files (`.env.development`, `.env.production`, `.env.test`). CI/test already seeds `NODE_ENV=test`. |
| **Seeding** | Use `npm run seed -- --reset` to populate sample projects/certificates/blog/testimonials. Supports `--collections` and `--dry-run`. |
| **Recurring jobs** | Newsletter digest is scheduled weekly via `node-cron` when the app boots. In distributed setups, run the job on a dedicated worker or leverage a job queue to avoid duplicate sends. |

### Minimal production `.env.production` example

```
NODE_ENV=production
PORT=4000
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>/portfolio?retryWrites=true&w=majority
REDIS_URL=rediss://:<password>@<host>:<port>
CLIENT_URL=https://portfolio.yourdomain.com
JWT_ACCESS_SECRET=<64-char-secret>
JWT_REFRESH_SECRET=<64-char-secret>
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
NOTIFICATION_EMAIL=hello@yourdomain.com
NEWSLETTER_CONFIRMATION_URL=https://portfolio.yourdomain.com/newsletter/confirm
PASSWORD_RESET_URL=https://portfolio.yourdomain.com/auth/reset-password
```

Ensure the hosting platform exposes `PORT`, forwards WebSocket traffic (Socket.IO), and allows outbound SMTP connections.

## 🔐 Roles & Permissions
- `admin` – full access to every action (content management, analytics, newsletter dispatch, exports).
- `editor` – create/update/delete content (projects, certificates, blog posts, testimonials, uploads) and manage contact follow-up.
- `guest` – read-only defaults for newly registered accounts.
- Route guards use the reusable `authorizeAction` middleware in `src/middleware/auth.middleware.ts`, backed by policies defined in `src/utils/auth/policies.ts`.

## 🗃️ Database Seeding
- Seed with curated sample data using the CLI: `npm run seed` (optional flags `--collections`, `--reset`, `--dry-run`).
- Seed definitions live in `src/database/seeders/sampleData.ts`; extend them or point to external datasets as required.

## 🧪 Testing
- `npm test` executes Vitest with Supertest-powered integration specs running against an in-memory MongoDB instance.
- Tests live under `src/tests` and share helpers for spinning up/tearing down the ephemeral database.
- Vitest configuration resides in `vitest.config.ts` (with TS path aliases respected via `vite-tsconfig-paths`).

## 📘 API Documentation
- `docs/api.md` – Human-readable endpoint reference.
- `docs/swagger.yaml` – Machine-readable OpenAPI definition (starter stub).
- Live Swagger UI available at `http://localhost:4000/docs` when running `npm run dev`.

## 🧩 Scripts
- `yarn dev` – Hot-reload development server with `tsx`.
- `yarn build` – Production build (`tsc` + `tsc-alias`).
- `yarn start` – Launch compiled server from `dist`.
- `yarn lint` / `yarn format` – Static analysis and formatting helpers.
- `npm run seed` – Populate MongoDB with the curated sample dataset.
- `npm test` – Execute the Vitest integration suite (Mongo Memory Server + Supertest).


## 🐳 Docker & Compose
- `docker build -t portfolio-backend .` – build the production image.
- `docker-compose up --build` – run the API, MongoDB, and Redis together.

The compose stack binds the API to `http://localhost:4000`, provisions MongoDB with a persistent volume, and boots Redis for caching/rate limiting. Override environment variables via `docker-compose.override.yml` or CLI `-e` flags for production secrets.

## 🔐 Environment Template
Duplicate `.env.example` into `.env.development`, `.env.production`, and `.env.test` as needed. Each variable is validated at boot, preventing silent misconfiguration.

Crafted to showcase senior-level backend engineering with futuristic flair. Integrate it with the companion frontend for a full-stack, immersive portfolio experience.

## 🚀 Render (Free Tier) Deploy
`render.yaml` already lives at the repo root (`Portfolio/backend`) and uses the Dockerfile for a hands-free deploy.

1) **Criar serviço**: Render → New → Web Service → selecione o repo → Root Directory: `Portfolio/backend` → plano Free → Render detecta o `render.yaml`.  
2) **Variáveis no dashboard** (não suba segredos no git):
   - `DATABASE_URL` (MongoDB Atlas, ex: `mongodb+srv://...`)
   - `REDIS_URL` (opcional mas recomendado, ex: Upstash/Redis Cloud)  
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (recrie strings fortes)  
   - `CLIENT_URL` = domínio do frontend (ex: `https://seu-portfolio.vercel.app`)  
   - `ASSET_BASE_URL` = URL pública do backend Render (ex: `https://<app>.onrender.com`)  
   - `NEWSLETTER_CONFIRMATION_URL` = `https://seu-portfolio.vercel.app/newsletter/confirm`  
   - `PASSWORD_RESET_URL` = `https://seu-portfolio.vercel.app/reset-password`  
   - Cloud/S3 se usar: `CLOUDINARY_*`, `AWS_*`  
   - `NOTIFICATION_EMAIL` (from/sender)  
   - (`PORT=4000`, `NODE_ENV=production` e tempos de JWT já estão no render.yaml)
3) **WebSockets/CORS**: no painel da Render, habilite WebSockets. No código, permita o domínio do frontend em CORS/Socket.IO origins.  
4) **Deploy**: Render vai buildar via Docker e expor HTTPS. Copie a URL pública para usar no frontend:
   - `VITE_API_URL=https://<app>.onrender.com/api`
   - `VITE_WS_URL=wss://<app>.onrender.com`

## 🚀 Vercel (Frontend) – apontando para o backend na Render
1) Root: `Portfolio/frontend`. Build: `npm run build`. Output: `dist`. Node: 18/20.  
2) Envs na Vercel:
   - `VITE_API_URL=https://<app>.onrender.com/api`
   - `VITE_WS_URL=wss://<app>.onrender.com` (ou derive automaticamente se preferir)  
3) Deploy e teste páginas críticas (/contact, /admin, /projects, /labs CRUD, sockets).
