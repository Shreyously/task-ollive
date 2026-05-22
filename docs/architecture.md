# Architecture Notes

This document outlines the core architectural patterns and design decisions of the Ollive platform. The system is engineered to capture detailed LLM inference telemetry without introducing latency into the user's chat experience.

---

## 1. System Overview

Ollive is a decoupled monorepo structured into three primary tiers:
1. **Frontend**: A React application that provides the chat interface and the metrics dashboard.
2. **API Gateway**: A stateless NestJS server that routes chat prompts, manages LLM streams, and emits observability events.
3. **Background Worker**: A dedicated queue consumer that scrubs sensitive data and persists logs asynchronously.

By segregating the API Gateway from the Background Worker, we ensure that heavy database writes and regex sanitization never block the live chat stream.

---

## 2. Ingestion Flow & Telemetry

To ensure telemetry collection doesn't degrade performance, we implement a **Fire-and-Forget** ingestion pipeline.

1. **SDK Interception**: A lightweight SDK wraps the LLM invocation, acting as a proxy to monitor the asynchronous stream.
2. **Metric Capture**: The SDK calculates execution latency (`performance.now()`) and tracks token distribution throughout the stream's lifecycle.
3. **Asynchronous Enqueueing**: Upon stream completion, the SDK immediately dispatches an `InferenceEventEnvelope` to a Redis-backed BullMQ queue. This dispatch is non-blocking; the API responds to the client without waiting for queue acknowledgment, guaranteeing optimal perceived performance.

---

## 3. Decoupled Logging Strategy

Rather than writing logs directly to the database during the HTTP request lifecycle, we utilize an event-driven queue.
The API Gateway acts solely as a producer, rapidly pushing logs into Redis. The Background Worker then consumes these events at its own pace, performs necessary data transformations (like PII redaction), and executes batch inserts into PostgreSQL. This buffers the database from sudden traffic spikes.

---

## 4. Scaling Considerations

The platform is designed to scale horizontally to support high throughput:

* **Stateless API Architecture**: The API Gateway maintains no in-memory session state. Incoming traffic can be distributed across multiple identical API instances behind a load balancer.
* **Configurable Worker Concurrency**: The background worker can process multiple jobs simultaneously. If telemetry ingestion outpaces processing, we can increase the worker instance count or adjust thread concurrency to drain the queue faster.
* **Read Replicas**: The analytics dashboard runs complex aggregate queries. To prevent these reads from locking transactional writes, future iterations will route dashboard requests to a PostgreSQL read replica.

---

## 5. Failure Handling Assumptions

The system is built on a "zero-trust" model regarding component reliability. We mitigate failures at multiple layers:

* **Provider Stream Failures**: We implement a stream-probing mechanism. Before passing the stream to the user, we evaluate the first chunk from the AI provider. If the connection fails or throws an error, the system intercepts it and instantly fails over to a secondary fallback model (e.g., Groq to Gemini) transparently.
* **Database Outages**: Because ingestion is decoupled, an outage in PostgreSQL will not crash the chat service. The API continues to function, and logs queue safely in Redis until the database recovers.
* **Unprocessible Jobs**: If a specific log event causes a persistence failure, the worker implements exponential backoff. After 4 failed attempts, the payload is safely routed to a Dead Letter Queue (DLQ) for manual inspection, ensuring the main processing pipeline remains unblocked.
