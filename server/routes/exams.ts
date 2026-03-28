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

// 创建新考试 (含问题)
router.post('/', async (req, res) => {
  try {
    const { courseId, title, description, startTime, duration, totalScore, questions } = req.body;
    
    // 1. 插入考试
    const { data: exam, error: eError } = await supabase
      .from('exams')
      .insert([{
        course_id: courseId,
        title,
        description,
        start_time: startTime,
        duration,
        total_score: totalScore,
        status: 'upcoming'
      }])
      .select()
      .single();
      
    if (eError) throw eError;
    
    // 2. 插入问题
    if (questions && questions.length > 0) {
      const questionsData = questions.map((q: any) => ({
        exam_id: exam.id,
        type: q.type,
        text: q.text,
        options: q.options,
        correct_answer: q.correctAnswer,
        score: q.score
      }));
      
      const { error: qError } = await supabase.from('questions').insert(questionsData);
      if (qError) throw qError;
    }
    
    res.status(201).json(exam);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
