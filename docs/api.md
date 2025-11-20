# Portfolio API Reference

This document outlines the primary endpoints exposed by the futuristic portfolio backend. Pair it with the OpenAPI spec (`swagger.yaml`) for machine-readable definitions.

**Role overview**
- `admin`: unrestricted access (content, analytics, exports, newsletter dispatch).
- `editor`: manage content (projects, certificates, blog, testimonials, uploads, contact follow-up).
- `guest`: read-only default for public registration.
The `authorizeAction` middleware enforces these policies—routes below note when elevated permissions are required.

## Authentication

### POST /api/auth/register
Registers an administrator account.
- **Body**: `{ name, email, password, headline?, bio? }`
- **Responses**:
  - `201 Created`: Returns the user profile and JWT tokens.
  - `409 Conflict`: Email already exists.

### POST /api/auth/login
Authenticates a user and issues access/refresh tokens.
- **Body**: `{ email, password }`
- **Responses**:
  - `200 OK`: Returns the user profile and JWT tokens.
  - `401 Unauthorized`: Invalid credentials.

### POST /api/auth/refresh
Refreshes the session using a refresh token (body or cookie).

### GET /api/auth/me
Returns the authenticated user profile. Requires `Authorization: Bearer <token>`.

### POST /api/auth/logout
Invalidates the active session and clears cookies.

### POST /api/auth/forgot-password
Triggers a password reset email.
- **Body**: `{ email }`

### POST /api/auth/reset-password
Sets a new password using the emailed token and issues fresh JWT cookies.
- **Body**: `{ token, password }`

## Projects

### GET /api/projects
Returns paginated projects sorted by prominence.
- **Query**: `page`, `limit` (default 12, max 50), `sortBy` (`createdAt`, `order`, `title`), `sortOrder`, `featured`, `category`, `technology`
- **Response**: `{ page, limit, data: Project[] }`

### GET /api/projects/featured
Returns featured projects optimized for the hero section.
- **Query**: `page`, `limit`, `sortBy`, `sortOrder`
- **Response**: `{ page, limit, data: Project[] }`

### GET /api/projects/:id
Returns a single project by MongoDB identifier.

### POST /api/projects
Creates a new project (admin only).
- **Body**: Project payload (`title`, `slug`, `description`, etc.).

### PUT /api/projects/:id
Updates an existing project (admin only).

### DELETE /api/projects/:id
Removes a project (admin only).

## Certificates

### GET /api/certificates
Returns paginated certificates, optionally filtered by level.
- **Query**: `page`, `limit`, `sortBy` (`issueDate`, `title`), `sortOrder`, `level`
- **Response**: `{ page, limit, data: Certificate[] }`

### GET /api/certificates/:id
Returns a single certificate.

Admin CRUD mirrors the project endpoints.

## Blog

### GET /api/blog
Returns paginated blog posts with optional filters.
- **Query**: `page`, `limit`, `sortBy` (`publishedAt`, `createdAt`, `title`), `sortOrder`, `tag`, `category`, `published`
- **Response**: `{ page, limit, data: BlogPost[] }`

### GET /api/blog/:id
Single post by id.

### POST /api/blog
Create post (admin).

### POST /api/blog/:postId/comments
Appends an approved comment to a post.

### PATCH /api/blog/:postId/comments/:commentId
Toggles comment approval (admin).

### POST /api/blog/:slug/views
Records a view and returns `{ views }`.

## Testimonials

### GET /api/testimonials
Retrieves paginated testimonials.
- **Query**: `page`, `limit`, `sortBy` (`createdAt`, `rating`, `name`), `sortOrder`, `featured`, `approved`
- **Response**: `{ page, limit, data: Testimonial[] }`

### CRUD
Create (public), update/delete/moderate (admin) endpoints mirror previous sections.

## Search

### GET /api/search
Performs federated search across projects, certificates, and blog posts.
- **Query**: `q` (min 2 chars), `limit` (max 50)
- **Caching**: results cached per term.

## Contact

### POST /api/contact
Submits a message (public) and emails the admin notification address if configured.

### PATCH /api/contact/:id/status
Updates a message status (admin) and records an activity log entry.

## Newsletter

### POST /api/newsletter/subscribe
Registers a subscriber and sends a confirmation email (double opt-in).

### POST /api/newsletter/unsubscribe
Marks a subscriber as unsubscribed.

### GET /api/newsletter (admin)
List subscribers with filters `confirmed`, `tag`.

### POST /api/newsletter/send (admin)
Triggers an immediate digest send (optional `subject`, `content`).

### DELETE /api/newsletter/:id (admin)
Removes a subscriber and logs the action.

## Analytics & Activity

- **POST /api/analytics**: Ingest analytics events.
- **GET /api/analytics/summary** / **GET /api/analytics/timeline**: Admin-only aggregated views.
- Activity logs are exposed via **GET /api/admin/metrics** (recent activity + totals).

## Admin Utilities

### GET /api/admin/metrics
Returns aggregate counts and the latest activity log entries.

### GET /api/admin/export/subscribers
Downloads confirmed subscribers as CSV.
- **Query**: `confirmed`, `tag`

### GET /api/admin/export/contacts
Downloads contact messages as CSV.
- **Query**: `status` (`new`, `in-progress`, `resolved`)

---
More modules (certificates, blog, analytics, chat) can be layered following the same patterns. Document them here as they are implemented.
