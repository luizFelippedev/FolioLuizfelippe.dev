# API Reference (direct and practical)

Language: Português (Brasil): [api.md](./api.md) | **English**

This file explains the backend API in the same way I present the project.
If you need machine-readable contract docs, use `swagger.yaml`.

## Quick permission model

- `admin`: full access.
- `editor`: content management with limited privileges.
- `guest`: default restricted profile.

Permissions are enforced by `authorizeAction` middleware.

## 1) Authentication

Goal: secure admin access and stable session handling.

- `POST /api/auth/register`
  - Public registration is disabled in this project.
  - Body: `{ name, email, password, headline?, bio? }`
  - Expected response: `403` (admin-only access policy).

- `POST /api/auth/login`
  - Authenticates and issues tokens.
  - Body: `{ email, password }`
  - Responses: `200` (ok), `401` (invalid credentials).

- `POST /api/auth/refresh`
  - Renews session using refresh token (cookie/body).

- `GET /api/auth/me`
  - Returns authenticated user profile.

- `POST /api/auth/logout`
  - Ends session and clears auth cookies/tokens.

- `POST /api/auth/forgot-password`
  - Starts password reset flow.
  - Body: `{ email }`

- `POST /api/auth/reset-password`
  - Resets password with emailed token.
  - Body: `{ token, password }`

## 2) Projects

Goal: feed the main portfolio section with pagination and filtering.

- `GET /api/projects`
  - List projects with pagination/filters.
  - Query: `page`, `limit`, `sortBy`, `sortOrder`, `featured`, `category`, `technology`.

- `GET /api/projects/featured`
  - List featured projects only.

- `GET /api/projects/:id`
  - Get one project by id.

- `POST /api/projects` (`admin`)
  - Create project.

- `PUT /api/projects/:id` (`admin`)
  - Update project.

- `DELETE /api/projects/:id` (`admin`)
  - Delete project.

- `POST /api/projects/:slug/views`
  - Registers unique view by IP.
  - Repeated requests from the same IP are ignored within the deduplication window.
  - Response: `{ views, counted }` (`counted=true` only when +1 was applied).

## 3) Certificates

Goal: expose certifications and technical progression.

- `GET /api/certificates`
  - List certificates with pagination and filters.

- `GET /api/certificates/:id`
  - Certificate details.

- Admin CRUD follows the same pattern as projects.

## 4) Blog

Goal: publish technical content and track interaction.

- `GET /api/blog`
  - List posts with filters (`tag`, `category`, `published`, etc).

- `GET /api/blog/:id`
  - Return one post.

- `POST /api/blog` (`admin`)
  - Create post.

- `POST /api/blog/:postId/comments`
  - Create comment.

- `PATCH /api/blog/:postId/comments/:commentId` (`admin`)
  - Approve/reject comment.

- `POST /api/blog/:slug/views`
  - Registers unique view by IP.
  - Response: `{ views, counted }`.

## 5) Testimonials

Goal: provide social proof.

- `GET /api/testimonials`
  - List testimonials with pagination.

- Creation can be public.
- Moderation/update/delete is admin-managed.

## 6) Search

Goal: improve navigation as content grows.

- `GET /api/search`
  - Federated search across projects, certificates, and blog.
  - Query: `q`, `limit`.
  - Per-term cache enabled.

## 7) Contact

Goal: turn visits into real opportunities.

- `POST /api/contact`
  - Public contact submission.
  - Can notify admin email when configured.

- `PATCH /api/contact/:id/status` (`admin`)
  - Updates status (`new`, `in-progress`, `resolved`).

## 8) Newsletter

Goal: keep continuous relationship with visitors.

- `POST /api/newsletter/subscribe`
  - Subscribe with double opt-in.

- `POST /api/newsletter/unsubscribe`
  - Unsubscribe.

- `GET /api/newsletter` (`admin`)
  - List subscribers with filters.

- `POST /api/newsletter/send` (`admin`)
  - Trigger manual campaign/send.

- `DELETE /api/newsletter/:id` (`admin`)
  - Remove subscriber.

## 9) Analytics and Admin

Goal: keep clear operational and product visibility.

- `POST /api/analytics`
  - Event ingestion.

- `GET /api/analytics/summary` (`admin`)
  - Aggregated summary.

- `GET /api/analytics/timeline` (`admin`)
  - Timeline view.

- `GET /api/admin/metrics` (`admin`)
  - Global metrics + recent activity.

- `GET /api/admin/export/subscribers` (`admin`)
  - Newsletter CSV export.

- `GET /api/admin/export/contacts` (`admin`)
  - Contact CSV export.

## Operational endpoints

- `GET /health`: basic health status.
- `GET /ready`: readiness for traffic.
- `GET /metrics`: Prometheus metrics.

## Real-time events (Socket.IO)

Namespace: `/notifications`

- Event emitted by backend: `views:update`
  - Payload: `{ contentType, contentKey, views, timestamp }`
  - Recommended channels:
    - `public-metrics` (public frontend)
    - `admin-alerts` (admin dashboard)

When new modules are added (advanced chat, automations, workers), this doc should stay updated in the same style: direct, practical, and business-context first.
