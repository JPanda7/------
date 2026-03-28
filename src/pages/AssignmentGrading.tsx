import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, CheckCircle, FileText } from 'lucide-react';

export default function AssignmentGrading() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { assignments, submissions, fetchAssignmentById, fetchSubmissions, gradeSubmission, batchGradeSubmissions, loading } = useAssignmentStore();

  const assignment = assignments.find(a => a.id === id);
  
  useEffect(() => {
    if (id) {
      fetchAssignmentById(id);
      fetchSubmissions(id);
    }
  }, [id, fetchAssignmentById, fetchSubmissions]);

  // Get latest submission for each student
  const assignmentSubmissions = submissions
    .filter(s => s.assignmentId === id && s.status !== 'draft')
    .sort((a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime());

  // Group by student, keep only the latest
  const latestSubmissions = Array.from(
    new Map(assignmentSubmissions.map(s => [s.studentId, s])).values()
  );

  const [grades, setGrades] = useState<Record<string, { manualScore: number; feedback: string }>>({});

  useEffect(() => {
    if (user?.role !== 'teacher' && user?.role !== 'admin') {
      navigate('/assignments');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Initialize grades state
    const initialGrades: Record<string, { manualScore: number; feedback: string }> = {};
    latestSubmissions.forEach(sub => {
      initialGrades[sub.id] = {
        manualScore: sub.manualScore || 0,
        feedback: sub.feedback || ''
      };
    });
    setGrades(initialGrades);
  }, [submissions, id]);

  if (!assignment) {
    return <div className="p-8 text-center text-gray-500">作业不存在</div>;
  }

  const handleGradeChange = (submissionId: string, field: 'manualScore' | 'feedback', value: any) => {
    setGrades(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value
      }
    }));
  };

  const handleBatchSave = async () => {
    const gradesToSave = Object.entries(grades).map(([id, data]) => ({
      id,
      manualScore: Number(data.manualScore),
      feedback: data.feedback
    }));
    await batchGradeSubmissions(gradesToSave);
    alert('批量评分保存成功');
  };

  const calculateTotal = (sub: any, manualScore: number) => {
    let total = (sub.autoScore || 0) + Number(manualScore);
    if (sub.isLate && assignment.latePenalty) {
      total = Math.max(0, total - assignment.latePenalty);
    }
    return total;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/assignments')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回作业列表
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">批改作业：{assignment.title}</h1>
        </div>
        <Button onClick={handleBatchSave}>
          <Save className="w-4 h-4 mr-2" />
          保存所有评分
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>提交列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生</TableHead>
                <TableHead>提交状态</TableHead>
                <TableHead>提交内容</TableHead>
                <TableHead>自动评分</TableHead>
                <TableHead>人工评分</TableHead>
                <TableHead>迟交扣分</TableHead>
                <TableHead>总分</TableHead>
                <TableHead className="w-1/3">教师评语</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestSubmissions.map((sub: any) => {
                const currentGrade = grades[sub.id] || { manualScore: 0, feedback: '' };
                const totalScore = calculateTotal(sub, currentGrade.manualScore);

                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{(sub as any).studentName || '未知学生'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        {sub.status === 'graded' ? (
                          <Badge variant="success">已批改</Badge>
                        ) : (
                          <Badge variant="secondary">待批改</Badge>
                        )}
                        {sub.isLate && <Badge variant="warning">迟交</Badge>}
                        <span className="text-xs text-gray-500">{new Date(sub.submitTime).toLocaleString('zh-CN')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {sub.fileName && (
                          <div className="flex items-center text-sm text-blue-600">
                            <FileText className="w-4 h-4 mr-1" />
                            {sub.fileName}
                          </div>
                        )}
                        {sub.content && (
                          <div className="text-xs text-gray-600 line-clamp-2" title={sub.content}>
                            {sub.content}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.questions && assignment.questions.length > 0 ? (
                        <span className="font-medium text-blue-600">{sub.autoScore || 0}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="w-20"
                        min="0"
                        value={currentGrade.manualScore}
                        onChange={(e) => handleGradeChange(sub.id, 'manualScore', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      {sub.isLate && assignment.latePenalty ? (
                        <span className="text-red-500">-{assignment.latePenalty}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-lg">{totalScore}</span>
                    </TableCell>
                    <TableCell>
                      <Textarea
                        placeholder="添加评语..."
                        className="min-h-[60px]"
                        value={currentGrade.feedback}
                        onChange={(e) => handleGradeChange(sub.id, 'feedback', e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {latestSubmissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    暂无学生提交作业
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
