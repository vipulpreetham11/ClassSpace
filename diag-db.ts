import { Client } from "pg";
import "dotenv/config";

async function check() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is missing!");
    return;
  }
  
  console.log("Checking connection to:", url.split("@")[1]); // Mask password

  const client = new Client({ connectionString: url });
  
  try {
    await client.connect();
    console.log("SUCCESS: Actually connected to DB!");
    const res = await client.query("SELECT version()");
    console.log("Server Version:", res.rows[0].version);
    await client.end();
  } catch (e: unknown) {
    console.error("CONNECTION FAILED!");
    if (e instanceof Error) {
      const maybeCode = (e as { code?: string }).code;
      console.error("Error Code:", maybeCode || "unknown");
      console.error("Message:", e.message);
      if (maybeCode === "ECONNREFUSED") {
        console.error("ADVICE: Port 5432 might be blocked. Try port 6543 or the Supavisor Pooler URL from Supabase dashboard.");
      }
      return
    }
    console.error("Unexpected error:", e);
  }
}

check();
