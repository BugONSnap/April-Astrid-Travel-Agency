ALTER TABLE "message" ADD COLUMN IF NOT EXISTS "request_status" text;
--> statement-breakpoint
COMMENT ON COLUMN "message"."request_status" IS 'For message_kind booking_request: PENDING | APPROVED | DENIED';
