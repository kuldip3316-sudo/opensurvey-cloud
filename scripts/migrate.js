import { Client } from 'pg';
import fs from 'fs';

async function run() {
  const sql = fs.readFileSync('supabase_schema.sql', 'utf8');
  console.log('Connecting to Supabase (ap-northeast-2)...');
  
  const client = new Client({
    host: process.env.SUPABASE_DB_HOST || 'aws-0-ap-northeast-2.pooler.supabase.com',
    port: 6543,
    user: 'postgres.cxqjtzfghighnoaskgbc',
    password: process.env.SUPABASE_DB_PASSWORD || 'S@mfit456789@#',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected! Executing supabase_schema.sql...');

  await client.query(sql);
  console.log('>>> SCHEMA MIGRATION EXECUTED SUCCESSFULLY! <<<');

  const res = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
  );
  console.log('Public tables in Supabase:', res.rows.map(r => r.table_name));

  const surveys = await client.query('SELECT id, title, slug, status FROM public.surveys;');
  console.log('Surveys in DB:', surveys.rows);

  await client.end();
  console.log('Migration finished cleanly.');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
