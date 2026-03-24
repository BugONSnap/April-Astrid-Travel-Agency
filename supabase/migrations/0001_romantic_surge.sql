ALTER TABLE "user" ALTER COLUMN "contact_number" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "contact_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "birthdate" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "gender" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "nationality" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "civil_status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "employment_status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "home_address" DROP NOT NULL;