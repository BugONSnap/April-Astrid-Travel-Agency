ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "conversation_id" integer;
ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "booking_kind" text DEFAULT 'PACKAGE' NOT NULL;
ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "service_title" text;
--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "package_id" DROP NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking" ADD CONSTRAINT "booking_conversation_id_conversation_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("conversation_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_package_kind_check" CHECK (
  (booking_kind = 'PACKAGE' AND package_id IS NOT NULL)
  OR (booking_kind = 'SERVICE' AND package_id IS NULL AND service_title IS NOT NULL AND length(trim(service_title)) > 0)
);
--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN IF NOT EXISTS "message_kind" text DEFAULT 'text' NOT NULL;
ALTER TABLE "message" ADD COLUMN IF NOT EXISTS "booking_id" integer;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_booking_id_booking_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("booking_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
