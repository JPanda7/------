import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// 获取课程资料列表
router.get('/', async (req, res) => {
  try {
    const { courseId, category } = req.query;
    let query = supabase
      .from('materials')
      .select('*, uploader:users!materials_uploader_id_fkey(real_name)')
      .order('created_at', { ascending: false });

    if (courseId) query = query.eq('course_id', courseId);
    if (category && category !== 'all') query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw error;

    const materials = data.map(m => ({
      id: m.id,
      courseId: m.course_id,
      name: m.name,
      type: m.type,
      size: m.size,
      url: m.url,
      category: m.category,
      uploadDate: m.created_at,
      uploaderName: m.uploader?.real_name,
    }));
    res.json(materials);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 新增资料（保存元数据，实际文件上传走 Storage）
router.post('/', async (req, res) => {
  try {
    const { courseId, name, type, size, url, category, uploaderId } = req.body;
    if (!courseId || !name || !url) {
      return res.status(400).json({ error: '课程ID、资料名称和链接为必填项' });
    }

    const { data, error } = await supabase
      .from('materials')
      .insert([{
        course_id: courseId,
        name,
        type: type || 'doc',
        size,
        url,
        category: category || 'reference',
        uploader_id: uploaderId,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({
      id: data.id,
      courseId: data.course_id,
      name: data.name,
      type: data.type,
      size: data.size,
      url: data.url,
      category: data.category,
      uploadDate: data.created_at,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 删除资料
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
