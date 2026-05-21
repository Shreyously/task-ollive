-- Add optional FK relations to keep observability logs linked while preserving decoupling.
ALTER TABLE "InferenceLog"
  ADD CONSTRAINT "InferenceLog_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InferenceLog"
  ADD CONSTRAINT "InferenceLog_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "Message"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
