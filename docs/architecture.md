# Architecture Notes

This document outlines the core architectural patterns and design decisions of the Ollive platform. The system is engineered to capture detailed LLM inference telemetry without introducing latency into the user's chat experience.

---

## 1. System Overview

Ollive is a decoupled monorepo structured into three primary tiers:
1. **Frontend**: A React application that provides the chat interface and the metrics dashboard.
2. **API Gateway**: A stateless NestJS server that routes chat prompts, manages LLM streams, and emits observability events.
3. **Background Worker**: A dedicated queue consumer that scrubs sensitive data and persists logs asynchronously.

By segregating the API Gateway from the Background Worker, we ensure that heavy database writes and regex sanitization never block the live chat stream.

### Why This Separation Matters

In a traditional monolithic setup, a single server would handle everything — accept the user's message, call the AI provider, stream tokens back, sanitize the response, and write the log to the database — all inside the same HTTP request. This creates a direct coupling: if the database is slow, the user's chat freezes. If PII redaction takes 50ms, that's 50ms of extra latency the user feels on every single message.

Ollive avoids this entirely. The API Gateway's only job during a chat request is:
1. Accept the prompt from the frontend.
2. Call the LLM provider and stream tokens back via SSE.
3. Drop a lightweight event onto a Redis queue (fire-and-forget).

That's it. The gateway never touches PostgreSQL during the chat flow. All the heavy lifting — validation, PII scrubbing, database inserts — happens in a completely separate Node.js process (the Worker) that consumes from the Redis queue at its own pace.

The `InferenceObserver` (our custom SDK in `packages/inference-sdk`) is the bridge between the gateway and the queue. It wraps every LLM call — both streaming and non-streaming — and automatically captures timing, token counts, and error details. When the stream finishes, it fires the telemetry event to the `IngestionService`, which pushes it into BullMQ. The observer never throws — even if Redis is completely down, the user's chat continues normally because the emit is wrapped in a `safeEmit()` that silently catches errors:

```typescript
// packages/inference-sdk/src/observer.ts
private async safeEmit(envelope: InferenceEventEnvelope): Promise<void> {
  try {
    await this.onEmit(envelope);
  } catch (emitError) {
    // Observability failures must never crash the primary execution flow
    console.error('Failed to emit inference event:', emitError);
  }
}
```

This is the core design principle: **observability is a side-effect, never a dependency**.

### Monorepo Structure

The project uses npm workspaces to manage five packages under a single repository:

| Package | Path | Purpose |
| :--- | :--- | :--- |
| **API** | `apps/api` | NestJS gateway — chat routing, SSE streaming, provider abstraction |
| **Worker** | `apps/worker` | BullMQ consumer — PII redaction, schema validation, database persistence |
| **Frontend** | `apps/frontend` | React + Vite — chat UI, analytics dashboard with Recharts |
| **Inference SDK** | `packages/inference-sdk` | Framework-agnostic observer that wraps LLM calls and emits telemetry |
| **Shared Types** | `packages/shared-types` | TypeScript interfaces and constants shared across packages |

Keeping the SDK as a standalone package is intentional. It has zero dependencies on NestJS, Prisma, or any framework. This means it could be extracted and published to npm tomorrow if we wanted external consumers to instrument their own LLM calls with Ollive-compatible telemetry.

---

## 2. Ingestion Flow & Telemetry

To ensure telemetry collection doesn't degrade performance, we implement a **Fire-and-Forget** ingestion pipeline. The key idea is simple: the user should never wait for a log to be written before seeing the next chat token.

### Step-by-Step: What Happens When a User Sends a Message

1. **User sends a prompt** → The React frontend POSTs to `/chat/stream` with the message content, session ID, and selected model.

2. **SDK wraps the provider call** → The `ChatService` doesn't call the LLM provider directly. Instead, it passes the call through `InferenceObserver.wrapStream()`. This wrapper starts a high-resolution timer (`performance.now()`) and sets up hooks to capture the stream's full lifecycle.

3. **Tokens stream back** → As the LLM generates each token, the SDK's wrapped iterator yields it normally to the chat controller, which writes it to the SSE connection. The user sees tokens in real-time. The SDK is transparent here — it simply accumulates the text and counts characters while passing chunks through.

4. **Stream completes** → When the iterator signals `done`, the SDK's `finalize()` function fires. It calculates total latency, estimates token counts (using a character-based heuristic: `Math.ceil(text.length / 4)`), and packages everything into an `InferenceEventEnvelope`:

    ```typescript
    {
      correlationId: "abc-123",       // Links this log to the original stream
      version: "v1",
      createdAt: "2026-05-22T...",
      payload: {
        requestId: "def-456",
        provider: "groq",
        model: "llama-3.3-70b-versatile",
        latencyMs: 1847,
        status: "success",
        tokenUsage: { promptTokens: 62, completionTokens: 198, totalTokens: 260 },
        inputPreview: "Explain quantum entanglement in simple...",
        outputPreview: "Quantum entanglement is a phenomenon..."
      }
    }
    ```

5. **Event is enqueued** → The `IngestionService` pushes this envelope into the `inference-events` BullMQ queue. The `add()` call is wrapped in a try/catch — if Redis is unreachable, we log the failure and move on. The user's response is already delivered.

6. **Worker picks it up** → On the other side, the `InferenceProcessor` (running in the Worker process) dequeues the job, validates the schema with `class-validator`, runs PII redaction through the `SanitizerService`, maps the event to the Prisma schema, and inserts it into PostgreSQL.

### Why Fire-and-Forget?

The alternative would be to write the log synchronously — call `prisma.inferenceLog.create()` inside the chat request handler. But that means:
- If PostgreSQL is under load, every chat response gets slower.
- If the database crashes, chat breaks completely.
- The user pays the latency cost of a database round-trip on every message.

With fire-and-forget, the log write could take 200ms or 2 seconds — it doesn't matter because the user never waits for it. The worst case is that a log is delayed, not that the chat is degraded.

---

## 3. Decoupled Logging Strategy

Rather than writing logs directly to the database during the HTTP request lifecycle, we utilize an event-driven queue. The API Gateway acts solely as a **producer**, rapidly pushing events into Redis. The Background Worker then **consumes** these events at its own pace, performs necessary data transformations (like PII redaction), and executes inserts into PostgreSQL.

### What The Worker Actually Does (Per Job)

When the worker picks up a job from the queue, it runs through a multi-stage pipeline:

```
Job Dequeued → Validate Schema → Sanitize PII → Map Enums → Persist to DB
```

**Stage 1 — Schema Validation**: The raw JSON payload is transformed into a `class-validator` DTO using `plainToInstance()`. If any required field is missing or has the wrong type, the job is rejected immediately. This protects against malformed events that could cause silent database errors.

**Stage 2 — PII Redaction**: The `SanitizerService` runs three regex patterns across `inputPreview`, `outputPreview`, and error messages:
- **Emails**: `user@example.com` → `[REDACTED_EMAIL]`
- **Credit Cards**: `4111 1111 1111 1111` → `[REDACTED_CC]`
- **Phone Numbers**: `+1-555-123-4567` → `[REDACTED_PHONE]`

Redaction happens on a copy of the event — the original job data is never mutated, which matters for retry scenarios where we need the original payload.

**Stage 3 — Enum Mapping**: SDK-level provider identifiers (lowercase strings like `"google"`, `"groq"`) are mapped to Prisma enum values (`GOOGLE`, `GROQ`). Same for status values (`"success"` → `SUCCESS`).

**Stage 4 — Database Insert**: The sanitized, validated event is persisted to the `InferenceLog` table via `prisma.inferenceLog.create()`.

### Why Not Write Logs Inline?

This decoupled approach provides three practical benefits:

1. **Traffic Buffering**: During a traffic spike (say, 100 users chatting simultaneously), the API can accept and stream all 100 requests immediately. The logs queue up in Redis and the worker drains them steadily. Without the queue, all 100 requests would compete for database connections at the same time.

2. **Independent Scaling**: If log processing falls behind, we can spin up more worker replicas without touching the API at all. The API and Worker scale independently based on their own bottlenecks (API scales on concurrent connections, Worker scales on queue depth).

3. **Failure Isolation**: A bug in PII redaction regex or a database schema mismatch only affects the worker process. The API continues serving chat requests without interruption. This is critical — a logging bug should never take down the product.

---

## 4. Scaling Considerations

The platform is designed to scale horizontally to support high throughput:

### Stateless API Architecture

The API Gateway maintains no in-memory session state. There are no sticky sessions, no in-memory caches, and no local file storage. Every piece of state lives in an external store:
- **Conversations and messages** → PostgreSQL
- **Queue jobs** → Redis
- **Session identity** → passed in every request via the `sessionId` field

This means we can run 1 API instance or 10, and the system behaves identically. A load balancer can distribute requests round-robin without worrying about session affinity. In the Kubernetes setup, this is reflected by the API deployment having a configurable `replicas` count — scaling is literally changing a number.

### Configurable Worker Concurrency

The background worker can process multiple jobs simultaneously. Concurrency is controlled by an environment variable (`WORKER_CONCURRENCY`, default: 5), meaning each worker instance handles 5 jobs in parallel. If telemetry ingestion outpaces processing, we have two levers:

1. **Vertical**: Increase `WORKER_CONCURRENCY` on the existing instance (e.g., from 5 to 20).
2. **Horizontal**: Deploy more worker replicas. Since BullMQ uses Redis-based locking, multiple worker instances safely compete for jobs without duplicating work.

### Redis as a Shock Absorber

Redis sits between the API and Worker and acts as a buffer during traffic spikes. If 500 events arrive in 1 second but the worker can only process 50/second, the remaining 450 simply wait in the queue. They're not lost, and the API doesn't slow down. Redis can comfortably hold tens of thousands of queued jobs in memory. We also configure automatic pruning (`removeOnComplete: { count: 500 }`, `removeOnFail: { count: 2000 }`) to prevent unbounded memory growth.

### Read Replicas (Future)

The analytics dashboard runs complex aggregate queries (`GROUP BY provider`, time-bucketed latency percentiles, etc.). Currently these hit the primary PostgreSQL instance. In a production deployment with significant traffic, these analytical reads would be routed to a PostgreSQL read replica to prevent them from competing with transactional writes from the worker.

---

## 5. Failure Handling Assumptions

The system is built on a "zero-trust" model regarding component reliability. Every external dependency — the LLM provider, the database, even Redis — is assumed to be capable of failing at any time. We mitigate failures at multiple layers:

### Provider Stream Failures

LLM APIs fail more often than traditional APIs. Rate limits, model overloads, and network timeouts are routine. We handle this with a **stream-probing** mechanism in the `ProviderService`:

```
Primary Stream → Read First Chunk → Success? → Yield to User
                                   → Failed?  → Fallback Stream → Yield to User
```

Before passing the stream to the user, we call `iterator.next()` to pull the first chunk from the AI provider. If the connection fails, returns an error, or produces an empty stream, we catch it instantly and establish a fresh stream with a fallback model. The user never sees the failure — they just get a response from a different model.

The fallback chain is defined explicitly:

| Primary Model | Fallback Model |
| :--- | :--- |
| `gemini-2.0-flash` | `llama-3.3-70b-versatile` |
| `llama-3.3-70b-versatile` | `llama-3.1-8b-instant` |
| `llama-3.1-8b-instant` | *(none — terminal)* |

This means a request for Gemini can silently fall back through Groq's Llama 70B, and if that also fails, down to Llama 8B. The fallback metadata is captured in the telemetry event, so the dashboard can show exactly how often fallbacks were triggered and for which models.

### Database Outages

Because telemetry ingestion is fully decoupled from the chat flow, a PostgreSQL outage does **not** crash the chat service. Here's what happens:

1. The user sends a message → the API calls the LLM provider → tokens stream back normally.
2. The telemetry event is enqueued to Redis → this succeeds because Redis is a separate service.
3. The worker picks up the job and tries to write to PostgreSQL → this fails.
4. BullMQ automatically retries the job with exponential backoff (1s → 2s → 4s → 8s).
5. If PostgreSQL recovers within the retry window, the log is persisted with no data loss.
6. If it doesn't recover after 4 attempts, the job moves to the Dead Letter Queue for manual inspection.

During the entire outage, the user's chat experience is completely unaffected. The only impact is that the analytics dashboard will show stale data until the database recovers and the queued logs are processed.

### Unprocessible Jobs

Sometimes a specific log event is fundamentally broken — maybe a provider returned an unexpected format, or a new model ID doesn't match the enum mapping. These events would fail on every retry attempt, so we need a way to isolate them without blocking the rest of the pipeline.

The worker implements exponential backoff with a maximum of 4 attempts. After all attempts are exhausted, the `DeadLetterService` moves the failed payload to a separate Redis queue (`inference-events-dlq`). The DLQ entry includes the original job data, the error message and stack trace, the number of attempts made, and a failure timestamp. This ensures the main processing pipeline remains unblocked while preserving the evidence needed for debugging.

### Redis Unavailability

If Redis itself goes down, the `IngestionService.enqueue()` call fails. But because the enqueue is wrapped in a try/catch with a swallowed error, the chat stream continues. The telemetry event is lost in this scenario — this is an accepted tradeoff. In practice, Redis has near-perfect uptime in managed deployments, and the alternative (writing directly to PostgreSQL as a fallback) would re-introduce the coupling we specifically designed to avoid.
