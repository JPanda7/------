import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, User, Calendar, Plus, Edit3 } from 'lucide-react';

export default function Courses() {
  const { user } = useAuthStore();
  const { courses, fetchCourses } = useCourseStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const getTeacherName = (course: any) => {
    return course.teacherName || '未知教师';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">课程管理</h1>
        {user?.role === 'admin' && (
          <Button onClick={() => navigate('/courses/new')}>
            <Plus className="w-4 h-4 mr-2" />
            创建课程
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden flex flex-col">
            <div className="bg-blue-600 h-24 relative">
              {user?.role === 'admin' && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white"
                  onClick={() => navigate(`/courses/${course.id}/edit`)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  编辑
                </Button>
              )}
            </div>
            <CardHeader className="relative pb-0">
              <div className="absolute -top-10 left-6 bg-white p-3 rounded-xl shadow-md border border-gray-100">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <div className="pt-6 flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">{course.courseName}</CardTitle>
                  <CardDescription className="text-sm mt-1">课程代码: {course.courseCode}</CardDescription>
                </div>
                <Badge variant={course.status === 'published' ? 'success' : 'secondary'} className="text-xs px-2 py-1">
                  {course.status === 'published' ? '已发布' : '草稿'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 flex-grow">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{getTeacherName(course)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{course.credit} 学分 / {course.hours} 学时</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{course.semester}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">课程简介</h3>
                <p className="text-sm text-gray-600 line-clamp-3">
                  本课程旨在培养学生在财务管理领域应用Python进行大数据分析的能力。通过学习Python编程基础、数据处理库（如Pandas、NumPy）、数据可视化技术，结合真实的财务数据案例，让学生掌握如何从海量财务数据中提取有价值的信息，进行财务预测、风险评估和投资决策分析。
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
            暂无课程数据
          </div>
        )}
      </div>
    </div>
  );
}
