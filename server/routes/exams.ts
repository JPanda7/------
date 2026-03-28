import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// 获取某课程的所有考试
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { data: exams, error } = await supabase
      .from('exams')
      .select('*, questions(*)')
      .eq('course_id', courseId);

    if (error) throw error;

    // Format to match frontend Exam type
    const formatted = exams.map(e => ({
      id: e.id,
      courseId: e.course_id,
      title: e.title,
      description: e.description,
      startTime: e.start_time,
      duration: e.duration,
      totalScore: e.total_score,
      status: e.status,
      questions: e.questions?.map((q: any) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        options: q.options,
        correctAnswer: q.correct_answer,
        score: q.score
      })) || []
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单场考试详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: exam, error } = await supabase
      .from('exams')
      .select('*, questions(*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    const formatted = {
      id: exam.id,
      courseId: exam.course_id,
      title: exam.title,
      description: exam.description,
      startTime: exam.start_time,
      duration: exam.duration,
      totalScore: exam.total_score,
      status: exam.status,
      questions: exam.questions?.map((q: any) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        options: q.options,
        correctAnswer: q.correct_answer,
        score: q.score
      })) || []
    };

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 更新考试
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, startTime, duration, totalScore, status, questions } = req.body;

    const { data: exam, error: eError } = await supabase
      .from('exams')
      .update({
        title,
        description,
        start_time: startTime,
        duration,
        total_score: totalScore,
        status
      })
      .eq('id', id)
      .select()
      .single();

    if (eError) throw eError;

    // 如果提供了问题，先删除旧的再插入新的 (简单处理)
    if (questions) {
      await supabase.from('questions').delete().eq('exam_id', id);
      const questionsData = questions.map((q: any) => ({
        exam_id: id,
        type: q.type,
        text: q.text,
        options: q.options,
        correct_answer: q.correctAnswer,
        score: q.score
      }));
      await supabase.from('questions').insert(questionsData);
    }

    res.json(exam);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 删除考试
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
