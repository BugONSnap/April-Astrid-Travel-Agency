import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// employment status enum
export const EMPLOYMENT_STATUS = ["STUDENT", "EMPLOYED", "UNEMPLOYED"] as const;
export const ENUM_EMPLOYMENT_STATUS = pgEnum(
  "employment_status",
  EMPLOYMENT_STATUS,
);

// role enum
export const ROLE = ["USER", "ADMIN"] as const;
export const ENUM_ROLE = pgEnum("role", ROLE);

export const user = pgTable("user", {
  user_id: serial("user_id").primaryKey(),
  first_name: text("first_name").notNull(),
  middle_name: text("middle_name").default(""),
  last_name: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  // optional fields for the admin. enforce validation on the client use zod for validation
  age: integer("age"),
  contact_number: integer("contact_number"),
  birthdate: timestamp("birthdate"),
  gender: text("gender"),
  nationality: text("nationality"),
  civil_status: text("civil_status"),
  employment_status: ENUM_EMPLOYMENT_STATUS("employment_status"),
  home_address: text("home_address"),
  profile_picture: text("profile_picture"),
  role: ENUM_ROLE("role").notNull().default("USER"),
  create_at: timestamp("created_at").notNull().defaultNow(),
  update_at: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export type UserType = typeof user.$inferInsert;
