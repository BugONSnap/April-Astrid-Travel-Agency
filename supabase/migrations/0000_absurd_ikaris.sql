CREATE TYPE "public"."employment_status" AS ENUM('STUDENT', 'EMPLOYED', 'UNEMPLOYED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "user" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text DEFAULT '',
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"age" integer,
	"contact_number" integer DEFAULT 11 NOT NULL,
	"birthdate" timestamp NOT NULL,
	"gender" text NOT NULL,
	"nationality" text NOT NULL,
	"civil_status" text NOT NULL,
	"employment_status" "employment_status" NOT NULL,
	"home_address" text NOT NULL,
	"profile_picture" text,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
