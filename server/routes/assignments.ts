import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// 获取单条作业及其详情 (包含问题)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: assignment, error } = await supabase
      .from('assignments')
      .select('*, questions(*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    const formatted = {
      id: assignment.id,
      courseId: assignment.course_id,
      title: assignment.title,
      description: assignment.description,
      requirements: assignment.requirements,
      deadline: assignment.deadline,
      totalScore: assignment.total_score,
      weight: assignment.weight,
      gradingCriteria: assignment.grading_criteria,
      allowLate: assignment.allow_late,
      latePenalty: assignment.late_penalty,
      isGroupAssignment: assignment.is_group_assignment,
      status: assignment.status,
      questions: assignment.questions?.map((q: any) => ({
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

// 获取某课程的所有作业
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*, questions(*)')
      .eq('course_id', courseId);

    if (error) throw error;

    const formatted = assignments.map(a => ({
      id: a.id,
      courseId: a.course_id,
      title: a.title,
      description: a.description,
      requirements: a.requirements,
      deadline: a.deadline,
      totalScore: a.total_score,
      weight: a.weight,
      gradingCriteria: a.grading_criteria,
      allowLate: a.allow_late,
      latePenalty: a.late_penalty,
      isGroupAssignment: a.is_group_assignment,
      status: a.status,
      questions: a.questions?.map((q: any) => ({
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

// 获取所有提交记录 (或通过过滤)
router.get('/submissions', async (req, res) => {
  try {
    const { assignmentId, studentId } = req.query;

    let query = supabase
      .from('submissions')
      .select('*, student:users(real_name, username)');
    
    if (assignmentId) query = query.eq('assignment_id', assignmentId);
    if (studentId) query = query.eq('student_id', studentId);

    const { data: subs, error } = await query;
    if (error) throw error;

    const formattedSubs = subs.map((s: any) => ({
      id: s.id,
      assignmentId: s.assignment_id,
      studentId: s.student_id,
      studentName: s.student?.real_name || s.student?.username || '未知学生',
      submitTime: s.submit_time,
      score: s.score,
      autoScore: s.auto_score,
      manualScore: s.manual_score,
      feedback: s.feedback,
      status: s.status,
      isLate: s.is_late,
      content: s.content,
      fileUrl: s.file_url,
      fileName: s.file_name,
      answers: s.answers
    }));

    res.json(formattedSubs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 提交作业
router.post('/submissions', async (req, res) => {
  try {
    const sub = req.body;
    const { data, error } = await supabase
      .from('submissions')
      .upsert({
        assignment_id: sub.assignmentId,
        student_id: sub.studentId,
        content: sub.content,
        file_name: sub.fileName,
        file_url: sub.fileUrl,
        answers: sub.answers,
        status: sub.status || 'submitted',
        submit_time: new Date().toISOString()
      }, { onConflict: 'assignment_id,student_id' })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 创建新作业
router.post('/', async (req, res) => {
  try {
    const { courseId, title, description, requirements, deadline, totalScore, questions } = req.body;
    
    const { data: assignment, error: aError } = await supabase
      .from('assignments')
      .insert([{
        course_id: courseId,
        title,
        description,
        requirements,
        deadline,
        total_score: totalScore,
        status: 'active'
      }])
      .select()
      .single();

    if (aError) throw aError;

    if (questions && questions.length > 0) {
      const qData = questions.map((q: any) => ({
        assignment_id: assignment.id,
        type: q.type,
        text: q.text,
        options: q.options,
        correct_answer: q.correctAnswer,
        score: q.score
      }));
      await supabase.from('questions').insert(qData);
    }

    res.status(201).json(assignment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 更新作业
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('assignments')
      .update({
        title: updates.title,
        description: updates.description,
        deadline: updates.deadline,
        status: updates.status
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 批改作业
router.patch('/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { manualScore, feedback, status, score } = req.body;
    
    const { data, error } = await supabase
      .from('submissions')
      .update({
        manual_score: manualScore,
        feedback: feedback,
        status: status || 'graded',
        score: score
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
