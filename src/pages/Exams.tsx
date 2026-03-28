import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useExamStore } from '@/store/examStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, PlayCircle, Settings, BarChart, Edit3 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Exams() {
  const { user } = useAuthStore();
  const { exams } = useExamStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExams = exams.filter(e =>
    e.title.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4 w-full max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索考试名称..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Button onClick={() => navigate('/exams/new')}>
            <Plus className="w-4 h-4 mr-2" />
            创建考试
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>考试列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>考试名称</TableHead>
                <TableHead>开始时间</TableHead>
                <TableHead>时长(分钟)</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.title}</TableCell>
                  <TableCell>{new Date(exam.startTime).toLocaleString('zh-CN')}</TableCell>
                  <TableCell>{exam.duration}</TableCell>
                  <TableCell>
                    <Badge variant={exam.status === 'upcoming' ? 'warning' : 'secondary'}>
                      {exam.status === 'upcoming' ? '未开始' : '已结束'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {user?.role === 'student' ? (
                      <Button variant="outline" size="sm" disabled={exam.status === 'finished'}>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        进入考试
                      </Button>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/exams/${exam.id}/edit`)}
                          disabled={exam.status === 'finished'}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          编辑
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          考试管理
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/exams/${exam.id}/analysis`)}
                          disabled={exam.status === 'upcoming'}
                        >
                          <BarChart className="w-4 h-4 mr-2" />
                          统计分析
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredExams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    没有找到相关考试
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
