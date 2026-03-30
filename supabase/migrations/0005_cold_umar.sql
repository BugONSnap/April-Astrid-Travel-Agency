ALTER TABLE "booking" ALTER COLUMN "package_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "conversation_id" integer;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "booking_kind" text DEFAULT 'PACKAGE' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "service_title" text;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "message_kind" text DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "booking_id" integer;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_conversation_id_conversation_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("conversation_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_booking_id_booking_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("booking_id") ON DELETE no action ON UPDATE no action;