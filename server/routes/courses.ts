import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// 获取课程列表
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        teacher:users!courses_teacher_id_fkey(id, real_name, username)
      `);

    if (error) throw error;

    const courses = data.map(c => ({
      id: c.id,
      courseCode: c.course_code,
      courseName: c.course_name,
      teacherId: c.teacher_id,
      teacherName: c.teacher?.real_name,
      credit: c.credit,
      hours: c.hours,
      status: c.status,
      semester: c.semester
    }));

    res.json(courses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单门课程详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Course not found' });
      throw error;
    }

    res.json({
      id: data.id,
      courseCode: data.course_code,
      courseName: data.course_name,
      teacherId: data.teacher_id,
      credit: data.credit,
      hours: data.hours,
      status: data.status,
      semester: data.semester
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 创建新课程
router.post('/', async (req, res) => {
  try {
    const newCourse = req.body;
    const courseData = {
      course_code: newCourse.courseCode,
      course_name: newCourse.courseName,
      teacher_id: newCourse.teacherId,
      credit: newCourse.credit,
      hours: newCourse.hours,
      status: newCourse.status || 'draft',
      semester: newCourse.semester
    };

    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取课程成绩汇总 (用于成绩页面)
router.get('/:id/grades', async (req, res) => {
  try {
    const { id: courseId } = req.params;

    // 1. 获取该课程下的所有学生
    const { data: students, error: sError } = await supabase
      .from('users')
      .select('id, real_name, username')
      .eq('role', 'student');

    if (sError) throw sError;

    // 2. 获取该课程下的所有作业和考试
    const { data: assignments } = await supabase.from('assignments').select('*').eq('course_id', courseId);
    const { data: exams } = await supabase.from('exams').select('*').eq('course_id', courseId);

    // 3. 获取所有提交记录
    const { data: submissions } = await supabase.from('submissions').select('*');

    const gradeSummary = students.map(student => {
      // 计算作业平均分
      const studentSubs = submissions?.filter(s => s.student_id === student.id) || [];
      const assignmentScores = assignments?.map(a => {
        const sub = studentSubs.find(s => s.assignment_id === a.id);
        return sub ? sub.score : 0;
      }) || [];
      
      const avgAssignment = assignmentScores.length > 0 
        ? assignmentScores.reduce((a, b) => a + b, 0) / assignmentScores.length 
        : 0;

      const avgExam = 0; // 考试部分逻辑待完善
      const finalGrade = (avgAssignment * 0.4) + (avgExam * 0.6);

      return {
        studentId: student.id,
        studentName: student.real_name || student.username,
        assignmentGrade: Math.round(avgAssignment),
        examGrade: Math.round(avgExam),
        finalGrade: Math.round(finalGrade),
        rank: 0
      };
    });

    gradeSummary.sort((a, b) => b.finalGrade - a.finalGrade);
    gradeSummary.forEach((g, i) => g.rank = i + 1);

    res.json(gradeSummary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
