// Apply migrations to the database in DATABASE_URL (e.g. Supabase).
import { migratePostgres } from "../src/server/db/postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Local demo mode migrates PGlite automatically on startup.");
  process.exit(1);
}
migratePostgres(url).then(
  () => console.log("Migrations applied."),
  (err) => {
    console.error("Migration failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
