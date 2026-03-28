import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// 获取用户列表（支持按角色过滤）
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    let query = supabase.from('users').select('id, username, real_name, role, avatar, created_at');
    if (role) query = query.eq('role', role);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const users = data.map(u => ({
      id: u.id,
      username: u.username,
      realName: u.real_name,
      role: u.role,
      avatar: u.avatar,
      createdAt: u.created_at,
    }));
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 新增用户
router.post('/', async (req, res) => {
  try {
    const { username, realName, role, password } = req.body;
    if (!username || !realName || !role) {
      return res.status(400).json({ error: '用户名、姓名和角色为必填项' });
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ username, real_name: realName, role, password_hash: password || username }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: '用户名已存在' });
      throw error;
    }

    res.status(201).json({
      id: data.id,
      username: data.username,
      realName: data.real_name,
      role: data.role,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 更新用户信息（包括重置密码）
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { realName, role, password } = req.body;

    const updateData: Record<string, any> = {};
    if (realName) updateData.real_name = realName;
    if (role) updateData.role = role;
    if (password) updateData.password_hash = password;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ id: data.id, username: data.username, realName: data.real_name, role: data.role });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
