import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Client } = pg;

async function runMigration() {
  const rawUrl = process.env.DATABASE_URL || '';
  const sanitizedUrl = rawUrl.trim().replace(/^["']|["']$/g, '');

  if (!sanitizedUrl) {
    console.error('DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: sanitizedUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    console.log('Connected successfully.');

    const migrationsDir = path.resolve('supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const sqlPath = path.join(migrationsDir, file);
      console.log(`Executing migration: ${file}...`);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await client.query(sql);
      console.log(`Migration ${file} completed successfully!`);
    }

    console.log('All database migrations applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
