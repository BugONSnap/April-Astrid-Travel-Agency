import postgres from "postgres";
import "dotenv/config";

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");

  const sql = postgres(url, { max: 1, prepare: false });

  try {
    await sql.unsafe("DROP SCHEMA public CASCADE;");
    await sql.unsafe("CREATE SCHEMA public;");
    await sql.unsafe("GRANT ALL ON SCHEMA public TO postgres;");
    await sql.unsafe("GRANT ALL ON SCHEMA public TO public;");
    await sql.unsafe(
      "GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;"
    );
    await sql.unsafe(
      "GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;"
    );
    await sql.unsafe(
      "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;"
    );
    await sql.unsafe(
      "GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;"
    );
    await sql.unsafe(
      "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;"
    );
    await sql.unsafe(
      "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;"
    );
    await sql.unsafe(
      "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;"
    );

    console.log("🔥 Database nuked and reset successfully");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

run();