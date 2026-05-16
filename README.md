# URL Shortener API

A production-oriented URL shortener service built with Node.js, PostgreSQL, and Redis. The system is designed with a layered architecture, supports authentication, caching, analytics, and rate limiting, and is fully containerized for reproducible local development.

---

## Features

* Deterministic URL shortening using Base62 encoding
* Stateless authentication using JWT
* Cache-aside pattern with Redis for fast URL resolution
* Click tracking and analytics
* Sliding window rate limiting using Redis sorted sets
* Background processing with BullMQ
* Docker-based environment for consistent setup
* Clear separation of concerns (Controller → Service → Repository)
* Asynchronous click tracking using BullMQ and Redis counters

---

## Architecture

```
Client
  |
  v
Express API (Node.js)
  |
  ├── Controllers (HTTP layer)
  │
  ├── Services (business logic)
  │
  ├── Repositories (data access via raw SQL)
  │
  ├── PostgreSQL (persistent storage)
  │
  ├── Redis
  │     ├── Cache (URL resolution)
  │     ├── Rate limiter
  │     └── Queue (BullMQ)
  │
  └── BullMQ Worker (separate process)
        └── Processes click events → PostgreSQL + Redis counters
  
```

---

## Tech Stack

| Technology        | Rationale                                  |
| ----------------- | ------------------------------------------ |
| Node.js + Express | Minimal, flexible HTTP server              |
| PostgreSQL        | Strong consistency and relational modeling |
| Redis             | Low-latency caching and distributed state  |
| BullMQ            | Reliable background job processing         |
| Zod               | Runtime validation and schema enforcement  |
| JWT               | Stateless authentication                   |
| Docker            | Environment reproducibility                |
| BullMQ Worker     | Async click processing and retry handling  |
---

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd url-shortener
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set a valid JWT secret:

```env
JWT_SECRET=your-32+character-secret
```

---

### 3. Start services

```bash
docker compose up --build
```

---

### 4. Verify health

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "postgres": "up",
  "redis": "up"
}
```

---

## API Endpoints

### Authentication

#### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"email":"test@example.com","password":"password123"}'
```

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"test@example.com","password":"password123"}'
```

---

### URL Operations

#### Create Short URL

```bash
curl -X POST http://localhost:3000/api/urls \
-H "Authorization: Bearer <TOKEN>" \
-H "Content-Type: application/json" \
-d '{"original_url":"https://example.com"}'
```

#### Redirect

```bash
curl -L http://localhost:3000/<shortCode>
```

#### List URLs

```bash
curl -X GET http://localhost:3000/api/urls \
-H "Authorization: Bearer <TOKEN>"
```

#### Get Stats

```bash
curl -X GET http://localhost:3000/api/urls/<code>/stats \
-H "Authorization: Bearer <TOKEN>"
```

#### Delete URL

```bash
curl -X DELETE http://localhost:3000/api/urls/<code> \
-H "Authorization: Bearer <TOKEN>"
```

---

## Postman Collection

A complete Postman collection is included to facilitate testing and demonstration.

### Location

```
postman/url-shortener.postman_collection.json
```

### Import Instructions

1. Open Postman
2. Click **Import**
3. Select the collection file from the `postman/` directory

### Supported Workflow

The collection is designed to be executed sequentially:

1. Register a user
2. Login (JWT token is captured and stored)
3. Create a short URL
4. Resolve (redirect) the URL
5. Fetch analytics
6. Delete the URL
7. Verify deletion (404 response)

### Notes

* The collection uses environment variables for:

  * `base_url`
  * `token`
  * `short_code`
* Serves as both:

  * an integration test suite
  * a demonstration script for interviews

---

## Design Decisions

### Base62 Encoding

Provides compact, URL-safe identifiers with deterministic mapping from numeric IDs.

### Redis Caching

Reduces database load and improves latency for frequently accessed URLs.

### Cache-Aside Strategy

Ensures consistency by populating cache only after successful database reads.

### Sliding Window Rate Limiter

Prevents burst abuse with higher accuracy than fixed-window approaches.

### No ORM

Raw SQL offers better performance, transparency, and control over queries.

### HTTP 302 Redirects

Avoids permanent caching, allowing flexibility for future changes or expirations.

### Asynchronous Click Tracking

This design ensures that redirect requests remain constant-time operations, as no database writes occur on the critical request path. Under load, this significantly improves throughput and reduces latency compared to synchronous designs.
---

## Database Schema

### Users

* id (UUID)
* email
* password_hash
* created_at

### URLs

* id (BIGSERIAL)
* original_url
* short_code
* user_id
* created_at
* expires_at

### Clicks

* id
* url_id
* clicked_at
* user_agent
* ip_hash

---

## Project Structure

```
src/
  config/
  controllers/
  services/
  repositories/
  middleware/
  routes/
  workers/
  utils/
migrations/
Dockerfile
docker-compose.yml
postman/
```

---

## Future Work

* Custom short codes
* Expiration enforcement and cleanup jobs
* Analytics dashboard
* Horizontal scaling (multi-instance + shared Redis)
* Distributed rate limiting improvements

---

## Author

Backend system design project focused on correctness, scalability, and operational clarity.
