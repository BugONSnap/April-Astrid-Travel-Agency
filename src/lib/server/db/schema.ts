import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

/* ================= ENUMS ================= */

// employment status
export const EMPLOYMENT_STATUS = ["STUDENT", "EMPLOYED", "UNEMPLOYED"] as const;
export const ENUM_EMPLOYMENT_STATUS = pgEnum(
  "employment_status",
  EMPLOYMENT_STATUS,
);

// role
export const ROLE = ["USER", "ADMIN", "SUPERADMIN"] as const;
export const ENUM_ROLE = pgEnum("role", ROLE);

// package category
export const PACKAGE_CATEGORY = ["STAR", "PROMO", "FEATURED"] as const;
export const ENUM_PACKAGE_CATEGORY = pgEnum(
  "package_category",
  PACKAGE_CATEGORY,
);

// booking status
export const BOOKING_STATUS = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
] as const;
export const ENUM_BOOKING_STATUS = pgEnum(
  "booking_status",
  BOOKING_STATUS,
);

// payment status
export const PAYMENT_STATUS = ["UNPAID", "PAID"] as const;
export const ENUM_PAYMENT_STATUS = pgEnum(
  "payment_status",
  PAYMENT_STATUS,
);

/* ================= USER ================= */

export const user = pgTable("user", {
  user_id: serial("user_id").primaryKey(),
  first_name: text("first_name").notNull(),
  middle_name: text("middle_name").default(""),
  last_name: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),

  age: integer("age"),
  contact_number: text("contact_number"),
  birthdate: timestamp("birthdate"),
  gender: text("gender"),
  nationality: text("nationality"),
  civil_status: text("civil_status"),
  employment_status: ENUM_EMPLOYMENT_STATUS("employment_status"),
  home_address: text("home_address"),
  profile_picture: text("profile_picture"),

  role: ENUM_ROLE("role").notNull().default("USER"),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").$onUpdate(() => new Date()),
});

/* ================= DESTINATION ================= */

export const destination = pgTable("destination", {
  destination_id: serial("destination_id").primaryKey(),
  country_name: text("country_name").notNull(),
  city_name: text("city_name"),
  description: text("description"),
  image_cover: text("image_cover"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

/* ================= PACKAGE ================= */

export const packageTable = pgTable("package", {
  package_id: serial("package_id").primaryKey(),

  package_name: text("package_name").notNull(),

  destination_id: integer("destination_id")
    .notNull()
    .references(() => destination.destination_id),

  category: ENUM_PACKAGE_CATEGORY("category").notNull(),

  description: text("description"),
  price: integer("price").notNull(),

  duration_days: integer("duration_days"),
  max_people: integer("max_people"),

  inclusions: text("inclusions"),
  exclusions: text("exclusions"),

  status: text("status").default("active"),

  created_by: integer("created_by").references(() => user.user_id),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").$onUpdate(() => new Date()),
});

/* ================= PACKAGE IMAGE ================= */

export const packageImage = pgTable("package_image", {
  image_id: serial("image_id").primaryKey(),

  package_id: integer("package_id")
    .notNull()
    .references(() => packageTable.package_id),

  image_url: text("image_url").notNull(),
});

/* ================= BOOKING ================= */

export const booking = pgTable("booking", {
  booking_id: serial("booking_id").primaryKey(),

  user_id: integer("user_id")
    .notNull()
    .references(() => user.user_id),

  package_id: integer("package_id")
    .notNull()
    .references(() => packageTable.package_id),

  booking_date: timestamp("booking_date").notNull().defaultNow(),
  travel_date: timestamp("travel_date"),

  number_of_people: integer("number_of_people").notNull(),
  total_price: integer("total_price").notNull(),

  booking_status: ENUM_BOOKING_STATUS("booking_status")
    .notNull()
    .default("PENDING"),

  payment_status: ENUM_PAYMENT_STATUS("payment_status")
    .notNull()
    .default("UNPAID"),

  created_at: timestamp("created_at").notNull().defaultNow(),
});

/* ================= PAYMENT ================= */

export const payment = pgTable("payment", {
  payment_id: serial("payment_id").primaryKey(),

  booking_id: integer("booking_id")
    .notNull()
    .references(() => booking.booking_id),

  amount: integer("amount").notNull(),

  payment_method: text("payment_method"),

  payment_status: ENUM_PAYMENT_STATUS("payment_status").notNull(),

  transaction_reference: text("transaction_reference"),

  payment_date: timestamp("payment_date").defaultNow(),
});

/* ================= BOOKMARK ================= */

export const bookmark = pgTable("bookmark", {
  bookmark_id: serial("bookmark_id").primaryKey(),

  user_id: integer("user_id")
    .notNull()
    .references(() => user.user_id),

  package_id: integer("package_id")
    .notNull()
    .references(() => packageTable.package_id),

  created_at: timestamp("created_at").notNull().defaultNow(),
});

/* ================= MESSAGING ================= */

// conversation (1 user ↔ 1 admin)
export const conversation = pgTable("conversation", {
  conversation_id: serial("conversation_id").primaryKey(),

  user_id: integer("user_id")
    .notNull()
    .references(() => user.user_id),

  admin_id: integer("admin_id").references(() => user.user_id),

  status: text("status").default("open"),

  created_at: timestamp("created_at").notNull().defaultNow(),
});

// messages (one-to-many inside conversation)
export const message = pgTable("message", {
  message_id: serial("message_id").primaryKey(),

  conversation_id: integer("conversation_id")
    .notNull()
    .references(() => conversation.conversation_id),

  sender_id: integer("sender_id")
    .notNull()
    .references(() => user.user_id),

  message_text: text("message_text").notNull(),

  is_read: integer("is_read").default(0),

  sent_at: timestamp("sent_at").notNull().defaultNow(),
});

/* ================= TYPES ================= */

export type UserType = typeof user.$inferInsert;