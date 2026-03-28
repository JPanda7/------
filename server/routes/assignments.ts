import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// =====================
// 精确路由（必须在通配符 /:id 之前注册！）
// =====================

// 获取某课程的所有作业
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*, questions(*)')
      .eq('course_id', courseId);

    if (error) throw error;

    const formatted = assignments.map((a: any) => ({
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

// 获取所有提交记录（支持 assignmentId/studentId 过滤）
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

// 保存草稿（不校验重复，允许多次覆盖；正式提交后无法回退草稿）
router.put('/submissions/draft', async (req, res) => {
  try {
    const sub = req.body;

    // 如果已经是正式提交，不允许回退为草稿
    const { data: existingSub } = await supabase
      .from('submissions')
      .select('status')
      .eq('assignment_id', sub.assignmentId)
      .eq('student_id', sub.studentId)
      .single();

    if (existingSub && existingSub.status !== 'draft') {
      return res.status(400).json({ error: '作业已正式提交，无法再次保存草稿。' });
    }

    const { data, error } = await supabase
      .from('submissions')
      .upsert({
        assignment_id: sub.assignmentId,
        student_id: sub.studentId,
        content: sub.content,
        file_name: sub.fileName,
        file_url: sub.fileUrl,
        answers: sub.answers,
        status: 'draft'
      }, { onConflict: 'assignment_id,student_id' })
      .select()
      .single();

    if (error) throw error;

    const formattedSub = {
      id: data.id,
      assignmentId: data.assignment_id,
      studentId: data.student_id,
      submitTime: data.submit_time,
      score: data.score,
      autoScore: data.auto_score,
      manualScore: data.manual_score,
      feedback: data.feedback,
      status: data.status,
      isLate: data.is_late,
      content: data.content,
      fileUrl: data.file_url,
      fileName: data.file_name,
      answers: data.answers
    };

    res.status(200).json(formattedSub);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 正式提交作业（校验重复，禁止二次提交）
router.post('/submissions', async (req, res) => {
  try {
    const sub = req.body;
    
    // 检查是否已经存在非草稿的提交
    const { data: existingSub } = await supabase
      .from('submissions')
      .select('status')
      .eq('assignment_id', sub.assignmentId)
      .eq('student_id', sub.studentId)
      .single();

    if (existingSub && existingSub.status !== 'draft') {
      return res.status(400).json({ error: '您已经提交过该作业，无法重复提交或修改。' });
    }

    const { data, error } = await supabase
      .from('submissions')
      .upsert({
        assignment_id: sub.assignmentId,
        student_id: sub.studentId,
        content: sub.content,
        file_name: sub.fileName,
        file_url: sub.fileUrl,
        answers: sub.answers,
        status: 'submitted',
        submit_time: new Date().toISOString(),
        is_late: sub.isLate || false
      }, { onConflict: 'assignment_id,student_id' })
      .select()
      .single();

    if (error) throw error;

    const formattedSub = {
      id: data.id,
      assignmentId: data.assignment_id,
      studentId: data.student_id,
      submitTime: data.submit_time,
      score: data.score,
      autoScore: data.auto_score,
      manualScore: data.manual_score,
      feedback: data.feedback,
      status: data.status,
      isLate: data.is_late,
      content: data.content,
      fileUrl: data.file_url,
      fileName: data.file_name,
      answers: data.answers
    };

    res.status(201).json(formattedSub);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 批改作业（PATCH /submissions/:submissionId）
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

// =====================
// 通配符路由（必须在精确路由之后！）
// =====================

// 获取单条作业详情（包含题目）
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

// 创建新作业
router.post('/', async (req, res) => {
  try {
    const { courseId, title, description, requirements, deadline, totalScore, weight, gradingCriteria, allowLate, latePenalty, isGroupAssignment, questions } = req.body;
    
    const { data: assignment, error: aError } = await supabase
      .from('assignments')
      .insert([{
        course_id: courseId,
        title,
        description,
        requirements,
        deadline,
        total_score: totalScore,
        weight: weight || null,
        grading_criteria: gradingCriteria || null,
        allow_late: allowLate || false,
        late_penalty: latePenalty || 0,
        is_group_assignment: isGroupAssignment || false,
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

export default router;
