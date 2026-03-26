import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  try {
    await client.connect();
    console.log("PG Native connected successfully!");
    const res = await client.query('SELECT current_user');
    console.log("Current user:", res.rows[0]);
    await client.end();
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("PG Native Error:", err.message);
      const maybeCode = (err as { code?: unknown }).code;
      if (typeof maybeCode === "string") console.error("PG Code:", maybeCode);
      if (err.stack) console.error(err.stack);
    } else {
      console.error("PG Native Error:", err);
    }
  }
}

main();
