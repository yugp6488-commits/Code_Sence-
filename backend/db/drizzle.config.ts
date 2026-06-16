import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "drizzle-kit";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

config({ path: resolve(__dirname, "../../artifacts/api-server/.env") });

const url = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "NEON_DATABASE_URL not found.\n" +
    "Make sure you have a file at: artifacts/api-server/.env\n" +
    "with: NEON_DATABASE_URL=postgresql://..."
  );
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: { url },
});