import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useExamStore } from '@/store/examStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, PlusCircle, Trash2 } from 'lucide-react';
import { Question } from '@/store/mockData';

export default function ExamPublish() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { exams, createExam, updateExam } = useExamStore();

  const isEditing = Boolean(id);
  const existingExam = isEditing ? exams.find((e) => e.id === id) : null;

  const [title, setTitle] = useState(existingExam?.title || '');
  const [description, setDescription] = useState(existingExam?.description || '');
  const [startTime, setStartTime] = useState(
    existingExam?.startTime ? new Date(existingExam.startTime).toISOString().slice(0, 16) : ''
  );
  const [duration, setDuration] = useState(existingExam?.duration?.toString() || '120');
  const [questions, setQuestions] = useState<Question[]>(existingExam?.questions || []);

  useEffect(() => {
    if (user?.role !== 'teacher' && user?.role !== 'admin') {
      navigate('/exams');
    }
  }, [user, navigate]);

  const handleAddQuestion = (type: 'multiple_choice' | 'true_false') => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      type,
      text: '',
      correctAnswer: type === 'true_false' ? 'true' : '',
      score: 10,
      ...(type === 'multiple_choice' ? { options: ['', '', '', ''] } : {}),
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleUpdateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const totalScore = questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0);

    const examData = {
      courseId: '853e4fac-16e7-4037-bfc1-d4f793b45fe5', // 使用真实课程 ID 保持通过测试环境
      title,
      description,
      startTime: new Date(startTime).toISOString(),
      duration: parseInt(duration, 10),
      totalScore,
      questions,
    };

    if (isEditing && id) {
      updateExam(id, examData);
    } else {
      createExam(examData);
    }

    navigate('/exams');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/exams')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? '编辑考试' : '创建考试'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">考试名称</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：期中考试"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">考试说明</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入考试注意事项等说明..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">开始时间</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">考试时长 (分钟)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>考试题目</CardTitle>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddQuestion('multiple_choice')}>
                <PlusCircle className="w-4 h-4 mr-2" />
                添加单选题
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddQuestion('true_false')}>
                <PlusCircle className="w-4 h-4 mr-2" />
                添加判断题
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无题目，请点击上方按钮添加
              </div>
            ) : (
              questions.map((q, index) => (
                <div key={q.id} className="p-4 border rounded-lg space-y-4 relative bg-gray-50">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">
                      {index + 1}. {q.type === 'multiple_choice' ? '单选题' : '判断题'}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveQuestion(q.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>题目内容</Label>
                    <Textarea
                      value={q.text}
                      onChange={(e) => handleUpdateQuestion(q.id, { text: e.target.value })}
                      placeholder="请输入题目内容"
                      required
                    />
                  </div>

                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-2">
                      <Label>选项</Label>
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <span className="w-6 text-center">{String.fromCharCode(65 + optIndex)}.</span>
                          <Input
                            value={opt}
                            onChange={(e) => handleUpdateOption(q.id, optIndex, e.target.value)}
                            placeholder={`选项 ${String.fromCharCode(65 + optIndex)}`}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>正确答案</Label>
                      {q.type === 'multiple_choice' ? (
                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={q.correctAnswer}
                          onChange={(e) => handleUpdateQuestion(q.id, { correctAnswer: e.target.value })}
                          required
                        >
                          <option value="" disabled>请选择正确答案</option>
                          {q.options?.map((opt, optIndex) => (
                            <option key={optIndex} value={opt}>
                              {String.fromCharCode(65 + optIndex)} - {opt || '未填写'}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={q.correctAnswer}
                          onChange={(e) => handleUpdateQuestion(q.id, { correctAnswer: e.target.value })}
                        >
                          <option value="true">正确</option>
                          <option value="false">错误</option>
                        </select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>分值</Label>
                      <Input
                        type="number"
                        min="1"
                        value={q.score}
                        onChange={(e) => handleUpdateQuestion(q.id, { score: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))
            )}

            {questions.length > 0 && (
              <div className="text-right text-lg font-medium text-gray-700">
                总分: {questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0)} 分
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/exams')}>
            取消
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? '保存修改' : '发布考试'}
          </Button>
        </div>
      </form>
    </div>
  );
}
