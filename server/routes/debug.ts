import { Router } from 'express';
import { supabase } from '../supabase.ts';

const router = Router();

router.get('/', async (req, res) => {
  const maskString = (str: string | undefined) => {
    if (!str) return '未定义 (MISSING)';
    if (str.length <= 8) return '********';
    return `${str.substring(0, 4)}***${str.substring(str.length - 4)}`;
  };

  const diagnostics: any = {
    status: 'checking',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: maskString(process.env.SUPABASE_URL),
      SUPABASE_ANON_KEY: maskString(process.env.SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: maskString(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    database_test: null
  };

  try {
    // 尝试简单的查询测试连通性
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    diagnostics.database_test = {
      connected: true,
      user_count: count,
      message: '数据库连接成功！'
    };
    diagnostics.status = 'ready';
  } catch (err: any) {
    diagnostics.database_test = {
      connected: false,
      error_message: err.message,
      error_details: err
    };
    diagnostics.status = 'error';
  }

  res.json(diagnostics);
});

export default router;
