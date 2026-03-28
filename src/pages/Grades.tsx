import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Edit, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';


export default function Grades() {
  const { user } = useAuthStore();
  const { courses, fetchCourses } = useCourseStore();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [gradeData, setGradeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      setLoading(true);
      fetch(`/api/courses/${selectedCourse}/grades`)
        .then(res => res.json())
        .then(data => {
          setGradeData(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [selectedCourse]);

  const filteredGrades = gradeData.filter(g => 
    g.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4 w-full max-w-2xl">
          <select 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="flex h-10 w-[240px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>选择课程查看成绩</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.courseName}</option>
            ))}
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索学生姓名..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            导出成绩
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>成绩列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生姓名</TableHead>
                <TableHead>平时成绩 (40%)</TableHead>
                <TableHead>考试成绩 (60%)</TableHead>
                <TableHead>最终得分</TableHead>
                <TableHead>排名</TableHead>
                <TableHead className="text-right">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrades.map((grade) => (
                <TableRow key={grade.studentId}>
                  <TableCell className="font-medium">{grade.studentName}</TableCell>
                  <TableCell>{grade.assignmentGrade}</TableCell>
                  <TableCell>{grade.examGrade}</TableCell>
                  <TableCell>
                    <span className={`font-bold ${grade.finalGrade >= 90 ? 'text-green-600' : grade.finalGrade < 60 ? 'text-red-600' : 'text-gray-900'}`}>
                      {grade.finalGrade}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">第 {grade.rank} 名</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="success">已统计</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredGrades.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={user?.role === 'student' ? 4 : 6} className="text-center py-8 text-gray-500">
                    没有找到相关成绩
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
