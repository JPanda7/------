import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// ── 签到会话 ──────────────────────────────────────────

// 获取签到会话列表
router.get('/sessions', async (req, res) => {
  try {
    const { courseId, status } = req.query;
    let query = supabase
      .from('attendance_sessions')
      .select('*, course:courses(course_name)')
      .order('start_time', { ascending: false });

    if (courseId) query = query.eq('course_id', courseId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    const sessions = data.map(s => ({
      id: s.id,
      courseId: s.course_id,
      courseName: s.course?.course_name || '',
      startTime: s.start_time,
      endTime: s.end_time,
      status: s.status,
      presentCount: s.present_count || 0,
      totalCount: s.total_count || 0,
    }));
    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 教师发起签到
router.post('/sessions', async (req, res) => {
  try {
    const { courseId, endTime, totalCount } = req.body;
    if (!courseId) return res.status(400).json({ error: 'courseId 为必填项' });

    const { data, error } = await supabase
      .from('attendance_sessions')
      .insert([{
        course_id: courseId,
        start_time: new Date().toISOString(),
        end_time: endTime || new Date(Date.now() + 30 * 60000).toISOString(),
        status: 'active',
        present_count: 0,
        total_count: totalCount || 45,
      }])
      .select('*, course:courses(course_name)')
      .single();

    if (error) throw error;
    res.status(201).json({
      id: data.id,
      courseId: data.course_id,
      courseName: data.course?.course_name || '',
      startTime: data.start_time,
      endTime: data.end_time,
      status: data.status,
      presentCount: data.present_count,
      totalCount: data.total_count,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 教师结束签到
router.patch('/sessions/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('attendance_sessions')
      .update({ status: 'closed' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ id: data.id, status: data.status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── 签到记录 ──────────────────────────────────────────

// 学生提交签到
router.post('/records', async (req, res) => {
  try {
    const { sessionId, studentId } = req.body;
    if (!sessionId || !studentId) return res.status(400).json({ error: '参数不完整' });

    // 检查会话是否有效
    const { data: session } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('status', 'active')
      .single();

    if (!session) return res.status(400).json({ error: '签到会话不存在或已结束' });

    // 检查是否已签到
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .single();

    if (existing) return res.status(409).json({ error: '您已完成签到' });

    // 写入记录并递增计数
    const { data: record, error: recErr } = await supabase
      .from('attendance_records')
      .insert([{ session_id: sessionId, student_id: studentId, status: 'present' }])
      .select()
      .single();

    if (recErr) throw recErr;

    await supabase
      .from('attendance_sessions')
      .update({ present_count: session.present_count + 1 })
      .eq('id', sessionId);

    res.status(201).json({ id: record.id, status: 'present', message: '签到成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 按学生获取签到记录
router.get('/records', async (req, res) => {
  try {
    const { studentId, courseId } = req.query;
    let query = supabase
      .from('attendance_records')
      .select('*, session:attendance_sessions(course_id, start_time, courses(course_name))');

    if (studentId) query = query.eq('student_id', studentId);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
