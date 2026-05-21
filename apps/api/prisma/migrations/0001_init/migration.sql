-- Create enums
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
CREATE TYPE "InferenceProvider" AS ENUM ('GOOGLE', 'GROQ');
CREATE TYPE "InferenceStatus" AS ENUM ('SUCCESS', 'ERROR', 'TIMEOUT', 'CANCELED');

-- Create tables
CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "title" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" "MessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InferenceLog" (
  "id" TEXT NOT NULL,
  "requestCorrelationId" TEXT NOT NULL,
  "conversationId" TEXT,
  "messageId" TEXT,
  "sessionId" TEXT NOT NULL,
  "provider" "InferenceProvider" NOT NULL,
  "model" TEXT NOT NULL,
  "status" "InferenceStatus" NOT NULL,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "latencyMs" INTEGER NOT NULL,
  "promptTokens" INTEGER,
  "completionTokens" INTEGER,
  "totalTokens" INTEGER,
  "fallbackFromProvider" "InferenceProvider",
  "fallbackFromModel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InferenceLog_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "Message"
  ADD CONSTRAINT "Message_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Query indexes for dashboard and observability exploration
CREATE INDEX "Conversation_sessionId_idx" ON "Conversation"("sessionId");
CREATE INDEX "Conversation_createdAt_idx" ON "Conversation"("createdAt");

CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

CREATE INDEX "InferenceLog_createdAt_idx" ON "InferenceLog"("createdAt");
CREATE INDEX "InferenceLog_provider_idx" ON "InferenceLog"("provider");
CREATE INDEX "InferenceLog_model_idx" ON "InferenceLog"("model");
CREATE INDEX "InferenceLog_provider_model_idx" ON "InferenceLog"("provider", "model");
CREATE INDEX "InferenceLog_createdAt_provider_idx" ON "InferenceLog"("createdAt", "provider");
CREATE INDEX "InferenceLog_sessionId_createdAt_idx" ON "InferenceLog"("sessionId", "createdAt");
CREATE INDEX "InferenceLog_requestCorrelationId_idx" ON "InferenceLog"("requestCorrelationId");

