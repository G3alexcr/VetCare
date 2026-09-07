import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const token = env.SUPABASE_ACCESS_TOKEN;
const projectId = env.SUPABASE_PROJECT_ID;

async function check() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const keys = await res.json();
  const serviceRoleKey = keys.find(k => k.name === 'service_role')?.api_key;
  const adminDb = createClient(env.VITE_SUPABASE_URL || env.SUPABASE_URL, serviceRoleKey);

  const { data: appts } = await adminDb.from('appointments').select('*');
  console.log("Appointments in DB:", appts?.length);
  if (appts) {
    appts.forEach(a => console.log(`Appt: id=${a.id}, date=${a.date}, time=${a.time}, status=${a.status}, reason=${a.reason}, pet_id=${a.pet_id}, client_id=${a.client_id}`));
  }

  const { data: consults } = await adminDb.from('consultations').select('*');
  console.log("Consultations in DB:", consults?.length);
  if (consults) {
    consults.forEach(c => console.log(`Consult: id=${c.id}, date=${c.date}, reason=${c.reason}, diagnosis=${c.diagnosis}`));
  }
}

check();
