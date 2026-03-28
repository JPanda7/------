import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.server') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('警告: 未找到 SUPABASE_URL 或 SUPABASE_KEY 环境变量，请在 .env.server 中配置');
}

// 使用 Service Role Key 可以在后端绕过 RLS (Row Level Security)，方便执行所有操作
export const supabase = createClient(supabaseUrl, supabaseKey);
