import "dotenv/config";
import { db } from "./index";
import { user } from "./schema";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  try {
    const existingAdmin = await db
      .select()
      .from(user)
      .where(eq(user.email, "admin@travelagency.com"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("✓ Admin user already exists");
      return;
    }

    await db.insert(user).values({
      first_name: "Admin",
      last_name: "User",
      email: "admin@travelagency.com",
      password: "SuperAdminPassword123!",
      role: "ADMIN",
    });

    console.log("✓ Admin user created successfully");
    console.log("  Email: admin@travelagency.com");
    console.log("  Password: SuperAdminPassword123");
  } catch (error) {
    console.error("✗ Failed to seed admin user:", error);
    process.exit(1);
  }
}

seedAdmin().finally(() => process.exit(0));
