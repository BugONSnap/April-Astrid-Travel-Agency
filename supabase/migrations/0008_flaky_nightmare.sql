ALTER TABLE "message" ADD COLUMN "file_url" text;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "file_name" text;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "file_type" text;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "file_size" integer;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "attachment_purpose" text;