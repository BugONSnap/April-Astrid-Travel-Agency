import "dotenv/config";
import { db } from "./index";
import { user } from "./schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../auth";

const SEED_PASSWORD = "Drkbug23";

async function seedAdminAndSuperadmin() {
  try {
    const adminEmail = "admin@travelagency.com";
    const superAdminEmail = "superadmin@travelagency.com";

    const adminPasswordHash = await hashPassword(SEED_PASSWORD);
    const superAdminPasswordHash = await hashPassword(SEED_PASSWORD);

    const adminRows = await db
      .select({ user_id: user.user_id })
      .from(user)
      .where(eq(user.email, adminEmail))
      .limit(1);

    if (adminRows.length > 0) {
      await db
        .update(user)
        .set({
          first_name: "Admin",
          last_name: "User",
          password: adminPasswordHash,
          role: "ADMIN",
        })
        .where(eq(user.email, adminEmail));
      console.log("✓ Admin user already existed (password updated)");
    } else {
      await db.insert(user).values({
        first_name: "Admin",
        last_name: "User",
        email: adminEmail,
        password: adminPasswordHash,
        role: "ADMIN",
      });
      console.log("✓ Admin user created successfully");
    }

    const superAdminRows = await db
      .select({ user_id: user.user_id })
      .from(user)
      .where(eq(user.email, superAdminEmail))
      .limit(1);

    if (superAdminRows.length > 0) {
      await db
        .update(user)
        .set({
          first_name: "Super",
          last_name: "Admin",
          password: superAdminPasswordHash,
          role: "SUPERADMIN",
        })
        .where(eq(user.email, superAdminEmail));
      console.log("✓ Superadmin user already existed (password updated)");
    } else {
      await db.insert(user).values({
        first_name: "Super",
        last_name: "Admin",
        email: superAdminEmail,
        password: superAdminPasswordHash,
        role: "SUPERADMIN",
      });
      console.log("✓ Superadmin user created successfully");
    }

    console.log("Seeding credentials:");
    console.log(`  Admin: ${adminEmail} / ${SEED_PASSWORD}`);
    console.log(`  Superadmin: ${superAdminEmail} / ${SEED_PASSWORD}`);
  } catch (error) {
    console.error("✗ Failed to seed admin/superadmin users:", error);
    process.exit(1);
  }
}

seedAdminAndSuperadmin().finally(() => process.exit(0));
