import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';

export default function CoursePublish() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { courses, createCourse, updateCourse } = useCourseStore();

  const isEditing = Boolean(id);
  const existingCourse = isEditing ? courses.find((c) => c.id === id) : null;

  const [courseCode, setCourseCode] = useState(existingCourse?.courseCode || '');
  const [courseName, setCourseName] = useState(existingCourse?.courseName || '');
  const [teacherId, setTeacherId] = useState(existingCourse?.teacherId || '');
  const [credit, setCredit] = useState(existingCourse?.credit?.toString() || '3');
  const [hours, setHours] = useState(existingCourse?.hours?.toString() || '48');
  const [semester, setSemester] = useState(existingCourse?.semester || '2026-Spring');
  const [status, setStatus] = useState<'draft' | 'published'>(existingCourse?.status || 'published');

  const [teachers, setTeachers] = useState<{id: string, realName: string, username: string}[]>([]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/courses');
      return;
    }
    // 获取教师列表
    fetch('/api/users?role=teacher')
      .then(res => res.json())
      .then(data => setTeachers(data.map((u: any) => ({
        id: u.id,
        realName: u.real_name || u.username,
        username: u.username
      }))));
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const courseData = {
      courseCode,
      courseName,
      teacherId,
      credit: Number(credit),
      hours: Number(hours),
      semester,
      status,
    };

    if (isEditing && id) {
      await updateCourse(id, courseData);
    } else {
      await createCourse(courseData);
    }

    navigate('/courses');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/courses')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? '编辑课程' : '创建课程'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>课程基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseCode">课程代码</Label>
                <Input
                  id="courseCode"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="例如：CS101"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseName">课程名称</Label>
                <Input
                  id="courseName"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="例如：计算机科学导论"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacherId">授课教师</Label>
              <select
                id="teacherId"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                required
              >
                <option value="" disabled>请选择授课教师</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.realName} ({t.username})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credit">学分</Label>
                <Input
                  id="credit"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">学时</Label>
                <Input
                  id="hours"
                  type="number"
                  min="1"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semester">开课学期</Label>
                <Input
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="例如：2026-Spring"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <select
                  id="status"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                  required
                >
                  <option value="published">已发布</option>
                  <option value="draft">草稿</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/courses')}>
            取消
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? '保存修改' : '创建课程'}
          </Button>
        </div>
      </form>
    </div>
  );
}
