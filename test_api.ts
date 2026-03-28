import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.server') });

const supabaseUrl = process.env.SUPABASE_URL || '';
// supabaseKey is pulling SUPABASE_SERVICE_ROLE_KEY intentionally as per original supabase.ts
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing with key starting with:', supabaseKey.substring(0, 15));
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', 'student1')
    .single();

  if (error) {
    console.error('SUPABASE API ERROR:', error);
  } else {
    console.log('API SUCCESS, user found:', user);
  }
}

test();
