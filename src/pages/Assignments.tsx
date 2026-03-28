import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useCourseStore } from '@/store/courseStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileUp, Eye, Edit3, CheckCircle, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Assignments() {
  const { user } = useAuthStore();
  const { assignments: allAssignments, fetchAssignments, submissions, loading } = useAssignmentStore();
  const { courses, fetchCourses } = useCourseStore();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const courseIdFromUrl = searchParams.get('courseId') || '';
  const [selectedCourse, setSelectedCourse] = useState(courseIdFromUrl);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      fetchAssignments(selectedCourse);
      setSearchParams({ courseId: selectedCourse });
    }
  }, [selectedCourse, fetchAssignments, setSearchParams]);

  const assignments = allAssignments.filter(a =>
    a.title.includes(searchTerm)
  );

  const getSubmissionStatus = (assignmentId: string) => {
    if (user?.role !== 'student') return null;
    const mySubmissions = submissions.filter(s => s.assignmentId === assignmentId && s.studentId === user.id);
    const submitted = mySubmissions.filter(s => s.status !== 'draft').sort((a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime());
    const draft = mySubmissions.find(s => s.status === 'draft');

    if (submitted.length > 0) {
      const latest = submitted[0];
      if (latest.status === 'graded') return <Badge variant="success">已批改 ({latest.score}分)</Badge>;
      if (latest.isLate) return <Badge variant="warning">迟交</Badge>;
      return <Badge variant="default">已提交</Badge>;
    }
    if (draft) return <Badge variant="secondary">草稿</Badge>;
    return <Badge variant="destructive">未提交</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4 w-full max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索作业标题..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="flex h-10 w-[240px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>筛选课程</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.courseName}</option>
            ))}
          </select>
        </div>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Button onClick={() => navigate(`/assignments/new?courseId=${selectedCourse}`)} disabled={!selectedCourse}>
            <Plus className="w-4 h-4 mr-2" />
            发布作业
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>作业列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>作业标题</TableHead>
                <TableHead>截止时间</TableHead>
                <TableHead>总分</TableHead>
                <TableHead>状态</TableHead>
                {user?.role === 'student' && <TableHead>我的提交</TableHead>}
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => {
                const mySubmissions = submissions.filter(s => s.assignmentId === assignment.id && s.studentId === user?.id);
                const submitted = mySubmissions.filter(s => s.status !== 'draft');
                const isDraft = mySubmissions.some(s => s.status === 'draft');
                const isSubmitted = submitted.length > 0;

                return (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>{format(new Date(assignment.deadline), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</TableCell>
                    <TableCell>{assignment.totalScore}</TableCell>
                    <TableCell>
                      <Badge variant={assignment.status === 'active' ? 'success' : 'secondary'}>
                        {assignment.status === 'active' ? '进行中' : '已截止'}
                      </Badge>
                    </TableCell>
                    {user?.role === 'student' && (
                      <TableCell>{getSubmissionStatus(assignment.id)}</TableCell>
                    )}
                    <TableCell className="text-right">
                      {user?.role === 'student' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={assignment.status === 'closed' && !isSubmitted}
                          onClick={() => navigate(`/assignments/${assignment.id}/submit`)}
                        >
                          {isSubmitted ? (
                            <><Eye className="w-4 h-4 mr-2" />查看 / 提交</>
                          ) : isDraft ? (
                            <><Edit3 className="w-4 h-4 mr-2" />继续编辑</>
                          ) : (
                            <><FileUp className="w-4 h-4 mr-2" />提交作业</>
                          )}
                        </Button>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/assignments/${assignment.id}/edit`)}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            编辑作业
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/assignments/${assignment.id}/grade`)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            批改作业
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {assignments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={user?.role === 'student' ? 6 : 5} className="text-center py-8 text-gray-500">
                    没有找到相关作业
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
