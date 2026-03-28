export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  username: string;
  realName: string;
  role: Role;
  avatar?: string;
}

export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  teacherId: string;
  credit: number;
  hours: number;
  status: 'draft' | 'published';
  semester: string;
}

export interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false';
  text: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  score: number;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  requirements?: string;
  deadline: string;
  totalScore: number;
  weight?: number;
  gradingCriteria?: string;
  allowLate?: boolean;
  latePenalty?: number; // Points deducted per day
  isGroupAssignment?: boolean;
  attachments?: { name: string; url: string }[];
  questions?: Question[]; // Objective questions
  status: 'active' | 'closed';
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submitTime: string;
  score?: number; // Total score
  autoScore?: number; // Score from objective questions
  manualScore?: number; // Score from teacher
  feedback?: string; // Teacher's comment
  status: 'draft' | 'submitted' | 'graded';
  isLate?: boolean;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  answers?: Record<string, string>; // questionId -> student's answer
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  startTime: string;
  duration: number; // in minutes
  totalScore: number;
  status: 'upcoming' | 'ongoing' | 'finished';
  questions?: Question[];
}

export const mockExams: Exam[] = [
  { id: 'e1', courseId: 'c1', title: '期中考试', startTime: '2026-04-15T14:00:00Z', duration: 120, totalScore: 100, status: 'upcoming' },
  { id: 'e2', courseId: 'c1', title: '第一单元测验', startTime: '2026-03-10T10:00:00Z', duration: 60, totalScore: 100, status: 'finished' },
];

export const mockUsers: User[] = [
  { id: 'u1', username: 'student1', realName: '张三', role: 'student' },
  { id: 'u2', username: 'student2', realName: '李四', role: 'student' },
  { id: 'u3', username: 'teacher1', realName: '王老师', role: 'teacher' },
  { id: 'u4', username: 'admin1', realName: '管理员', role: 'admin' },
];

export const mockCourses: Course[] = [
  { id: 'c1', courseCode: 'PY101', courseName: 'Python财管大数据', teacherId: 'u3', credit: 4, hours: 64, status: 'published', semester: '2026-Spring' },
];

export const mockAssignments: Assignment[] = [
  {
    id: 'a1',
    courseId: 'c1',
    title: '第一章课后作业',
    description: '完成课本P20的1-5题',
    deadline: '2026-03-20T23:59:59Z',
    totalScore: 100,
    status: 'active',
    allowLate: true,
    latePenalty: 5,
    questions: [
      { id: 'q1', type: 'multiple_choice', text: 'Python中用于定义函数的关键字是？', options: ['def', 'function', 'fun', 'define'], correctAnswer: 'def', score: 10 },
      { id: 'q2', type: 'true_false', text: 'Python中的列表(list)是不可变的数据类型。', correctAnswer: 'false', score: 10 }
    ]
  },
  { id: 'a2', courseId: 'c1', title: '第二章实验报告', description: '提交实验一的报告', deadline: '2026-03-10T23:59:59Z', totalScore: 100, status: 'closed', allowLate: false },
];

export const mockSubmissions: Submission[] = [
  { id: 's1', assignmentId: 'a2', studentId: 'u1', submitTime: '2026-03-09T10:00:00Z', score: 95, status: 'graded', content: '这是我的实验报告。', fileName: '实验报告.pdf' },
  { id: 's2', assignmentId: 'a1', studentId: 'u1', submitTime: '2026-03-15T10:00:00Z', status: 'submitted', content: '第一章作业已完成。' },
];
