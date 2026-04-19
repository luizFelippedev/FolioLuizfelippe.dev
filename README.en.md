# My Portfolio Backend

Language: Português (Brasil): [README.md](./README.md) | **English**

This project is the backend of my personal portfolio.
I built it to have full control of my platform: content, authentication, metrics, uploads, newsletter, and infrastructure integrations.

The goal was never just “another API”.
I wanted a production-ready foundation that I can evolve safely without breaking what is live.

## What I wanted to solve

- Centralize all data consumed by the frontend.
- Keep an admin area secure and easy to operate.
- Be ready for growth with cache, observability, and queues.
- Control upgrades manually (no forced auto-publish).

## Stack and why I chose it

- `Node.js + Express + TypeScript`: fast delivery with strong typing.
- `MongoDB`: flexible data model for projects, blog, certificates, testimonials, and newsletter.
- `Redis`: cache and better response times on hot endpoints.
- `Socket.IO`: real-time channel for notifications and analytics.
- `Groq`: hosted low-latency inference for the portfolio AI assistant.
- `Nginx`: stable reverse proxy in front of the API.
- `Prometheus + Grafana`: metrics and operational visibility.
- `RabbitMQ/Kafka/PostgreSQL` (optional profiles): prepared for advanced scenarios.

## Project structure

- `src/config`: env vars, connections, and external service setup.
- `src/controllers`: HTTP layer.
- `src/services`: business rules.
- `src/models`: Mongoose models.
- `src/middleware`: auth, validation, error handling, metrics.
- `src/routes`: route modules.
- `src/utils`: shared helpers (cache, logger, pagination, CSV, etc).

## Run locally

```bash
npm ci
npm run dev
```

Default backend URL: `http://localhost:4000`.

### Groq chatbot

The backend now exposes:

- `GET /api/chat/status`: Groq/provider and model readiness.
- `POST /api/chat/stream`: SSE streaming endpoint for the portfolio chatbot.

Recommended local flow:

```bash
npm run dev
```

Then configure the `GROQ_*` variables in `.env.development` with your Groq API key.

To run the full Docker stack:

```bash
docker compose --profile queues --profile streaming --profile sql up -d
```

Main local endpoints:
- API: `http://localhost`
- Health: `http://localhost/health`
- Ready: `http://localhost/ready`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

## Environment strategy (dev vs production)

I split environments to avoid a common mistake: changing local code/settings and affecting production unexpectedly.

- Development: `.env.development`
- Production: `.env.production`
- Local Docker: `.env`

Available templates:
- `.env.development.example`
- `.env.production.example`
- `.env.docker.example`

Variables are validated on startup (`src/config/env.config.ts`), so missing critical config fails early.

## Controlled deployment (upgrade only when I decide)

This was a hard requirement: no automatic upgrade in production.

- Render: `autoDeploy: false` in `render.yaml`.
- Local/self-hosted: manual release scripts.

My release flow:
1. Build a new image.
2. Validate with `npm run release:check`.
3. Activate manually: `npm run release:activate -- <image:tag>`.
4. Roll back if needed: `npm run release:rollback`.
5. Check current state: `npm run release:status`.

## Security and governance

- JWT access + refresh tokens.
- Rate limiting.
- Helmet hardening.
- Configurable CORS.
- Structured logs with request correlation IDs.
- Permission profiles (`admin`, `editor`, `guest`).

## Real-time views (IP-based anti-duplication)

- Blog endpoint: `POST /api/blog/:slug/views`
- Projects endpoint: `POST /api/projects/:slug/views`
- Rule: the same IP does not increment again inside the configured window (`VIEW_UNIQUE_TTL_SECONDS`).
- Real-time: when a new unique view is counted, backend emits `views:update` on Socket.IO namespace `/notifications` (channels `public-metrics` and `admin-alerts`).

## Quality and tests

- Lint: `npm run lint`
- Build: `npm run build`
- Integration tests: `npm test -- --run`

Tests run with in-memory MongoDB and have CI-stable timeout configuration.

## Seed data

```bash
npm run seed -- --reset
```

You can also use `--collections` and `--dry-run`.

## API and docs

- Human API guide: `docs/api.md` (PT-BR) / `docs/api.en.md` (EN)
- OpenAPI: `docs/swagger.yaml`
- Local Swagger UI: `http://localhost:4000/docs`

## Render (backend)

The backend is ready to deploy through `render.yaml`.

Quick flow:
1. Create a `Web Service` in Render using the `Backend` repository.
2. Keep `autoDeploy` disabled for manual releases.
3. Set environment variables in Render (not in git):
   - `DATABASE_URL`
   - `REDIS_URL`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `CLIENT_URL=https://luizfelippedev.vercel.app`
   - `CORS_ORIGINS=https://luizfelippedev.vercel.app`
   - `ASSET_BASE_URL=https://<your-app>.onrender.com`
   - `NEWSLETTER_CONFIRMATION_URL`
   - `PASSWORD_RESET_URL`
4. Enable WebSockets in Render.
5. Deploy manually when you want the upgrade live.

## Vercel (frontend)

The frontend runs on Vercel and consumes this backend on Render.

Expected frontend vars:
- `VITE_API_URL=https://<your-app>.onrender.com/api`
- `VITE_WS_URL=wss://<your-app>.onrender.com`

## Frontend and backend in separate folders

This setup works fine with independent directories, for example:

- `D:\Github\Backend`
- `D:\Github\Frontend`

The connection happens through URLs, not folder nesting:

- backend at `http://localhost:4000`
- frontend with `VITE_API_URL=http://localhost:4000/api`
- chatbot widget consuming `POST /api/chat/stream`

## Day-to-day commands

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm test -- --run`
- `npm run seed -- --reset`
- `npm run stack:up`
- `npm run stack:up:full`
- `npm run release:check`
- `npm run release:activate -- <image:tag>`
- `npm run release:rollback`
- `npm run release:status`

This backend is designed as a real production base, with full control over when and how upgrades go live.
