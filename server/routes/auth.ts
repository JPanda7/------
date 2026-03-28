import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// 简单的登录接口，这里为了简化演示，直接根据 username 查找用户
router.post('/login', async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 将数据库的下划线字段映射为前端需要的驼峰字段
    return res.json({
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 获取所有用户列表 (供下拉框等使用)
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    
    const users = data.map(user => ({
      id: user.id,
      username: user.username,
      realName: user.real_name,
      role: user.role,
      avatar: user.avatar
    }));
    
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
