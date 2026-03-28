import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useCourseStore } from '@/store/courseStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, X, PlusCircle } from 'lucide-react';

export default function AssignmentPublish() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { assignments, submissions, addAssignment, updateAssignment, fetchAssignmentById } = useAssignmentStore();
  const { courses, fetchCourses } = useCourseStore();
  const { addNotification } = useNotificationStore();

  const courseIdFromUrl = searchParams.get('courseId') || '';
  const isEdit = Boolean(id);
  const existingAssignment = isEdit ? assignments.find(a => a.id === id) : null;
  const currentCourse = courses.find(c => c.id === (existingAssignment?.courseId || courseIdFromUrl));
  const hasSubmissions = isEdit ? submissions.some(s => s.assignmentId === id && s.status !== 'draft') : false;
  const isPastDeadline = existingAssignment ? new Date(existingAssignment.deadline) < new Date() : false;

  const [title, setTitle] = useState(existingAssignment?.title || '');
  const [description, setDescription] = useState(existingAssignment?.description || '');
  const [requirements, setRequirements] = useState(existingAssignment?.requirements || '');
  const [deadline, setDeadline] = useState(existingAssignment?.deadline ? new Date(existingAssignment.deadline).toISOString().slice(0, 16) : '');
  const [totalScore, setTotalScore] = useState(existingAssignment?.totalScore?.toString() || '100');
  const [weight, setWeight] = useState(existingAssignment?.weight?.toString() || '10');
  const [gradingCriteria, setGradingCriteria] = useState(existingAssignment?.gradingCriteria || '');
  const [allowLate, setAllowLate] = useState(existingAssignment?.allowLate || false);
  const [latePenalty, setLatePenalty] = useState(existingAssignment?.latePenalty?.toString() || '0');
  const [isGroupAssignment, setIsGroupAssignment] = useState(existingAssignment?.isGroupAssignment || false);
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>(existingAssignment?.attachments || []);
  const [questions, setQuestions] = useState<any[]>(existingAssignment?.questions || []);

  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
    if (user?.role !== 'teacher' && user?.role !== 'admin') {
      navigate('/assignments');
    }
  }, [user, navigate, fetchCourses]);

  useEffect(() => {
    if (isEdit && id) {
      fetchAssignmentById(id);
    }
  }, [isEdit, id, fetchAssignmentById]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAttachments = Array.from(files).map(file => ({
        name: file.name,
        url: URL.createObjectURL(file), // Mock URL
      }));
      setAttachments([...attachments, ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const addQuestion = (type: 'multiple_choice' | 'true_false') => {
    setQuestions([...questions, {
      id: `q${Date.now()}`,
      type,
      text: '',
      options: type === 'multiple_choice' ? ['', '', '', ''] : undefined,
      correctAnswer: type === 'multiple_choice' ? '' : 'true',
      score: 10
    }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[optIndex] = value;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetCourseId = existingAssignment?.courseId || courseIdFromUrl;
    if (!targetCourseId) {
      setError('无法确定课程 ID，请返回重试');
      return;
    }

    if (!title || !description || !deadline || !totalScore) {
      setError('请填写所有必填字段');
      return;
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      setError('截止时间不能早于当前时间');
      return;
    }

    const assignmentData = {
      courseId: targetCourseId,
      title,
      description,
      requirements,
      deadline: deadlineDate.toISOString(),
      totalScore: Number(totalScore),
      weight: Number(weight),
      gradingCriteria,
      allowLate,
      latePenalty: Number(latePenalty),
      isGroupAssignment,
      attachments,
      questions,
    };

    if (isEdit) {
      await updateAssignment(id!, assignmentData);
    } else {
      await addAssignment(assignmentData);
      // Notify students
      addNotification({
        title: `新作业发布: ${title}`,
        message: `《${currentCourse?.courseName || '课程'}》发布了新作业，截止时间为 ${deadlineDate.toLocaleString('zh-CN')}，请及时完成。`,
        targetRole: 'student',
      });
    }

    navigate(`/assignments?courseId=${targetCourseId}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/assignments')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回作业列表
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? '编辑作业' : '发布新作业'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>作业详情 - {currentCourse?.courseName || '加载中...'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            {isPastDeadline && (
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-md text-sm">
                该作业已过截止时间，无法修改。
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">作业标题 <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：第一章课后作业"
                disabled={isPastDeadline}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">作业描述 <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述作业内容..."
                rows={3}
                disabled={isPastDeadline}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">详细要求</Label>
              <Textarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="输入作业的具体要求、格式规范等..."
                rows={4}
                disabled={isPastDeadline}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="deadline">截止时间 <span className="text-red-500">*</span></Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  disabled={isPastDeadline}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalScore">总分 <span className="text-red-500">*</span></Label>
                <Input
                  id="totalScore"
                  type="number"
                  min="0"
                  value={totalScore}
                  onChange={(e) => setTotalScore(e.target.value)}
                  disabled={isPastDeadline}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">成绩权重 (%)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  max="100"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  disabled={isPastDeadline}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="latePenalty">迟交惩罚 (每天扣分)</Label>
                <Input
                  id="latePenalty"
                  type="number"
                  min="0"
                  value={latePenalty}
                  onChange={(e) => setLatePenalty(e.target.value)}
                  disabled={isPastDeadline || !allowLate}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowLate"
                checked={allowLate}
                onChange={(e) => setAllowLate(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                disabled={isPastDeadline}
              />
              <Label htmlFor="allowLate" className={`cursor-pointer ${isPastDeadline ? 'opacity-50' : ''}`}>
                允许迟交 (截止时间后仍可提交，但会标记为迟交)
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradingCriteria">评分标准</Label>
              <Textarea
                id="gradingCriteria"
                value={gradingCriteria}
                onChange={(e) => setGradingCriteria(e.target.value)}
                placeholder="例如：代码规范占20%，功能实现占80%..."
                rows={3}
                disabled={hasSubmissions || isPastDeadline}
              />
              {(hasSubmissions && !isPastDeadline) && (
                <p className="text-xs text-yellow-600 mt-1">
                  已有学生提交作业，无法修改评分标准。
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isGroupAssignment"
                checked={isGroupAssignment}
                onChange={(e) => setIsGroupAssignment(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                disabled={isPastDeadline}
              />
              <Label htmlFor="isGroupAssignment" className={`cursor-pointer ${isPastDeadline ? 'opacity-50' : ''}`}>
                设置为小组作业 (支持小组成员协作)
              </Label>
            </div>

            <div className="space-y-4 border-t pt-6">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-medium">客观题设置 (自动评分)</Label>
                {!isPastDeadline && (
                  <div className="space-x-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('multiple_choice')}>
                      <PlusCircle className="w-4 h-4 mr-1" /> 添加选择题
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('true_false')}>
                      <PlusCircle className="w-4 h-4 mr-1" /> 添加判断题
                    </Button>
                  </div>
                )}
              </div>

              {questions.length === 0 ? (
                <p className="text-sm text-gray-500">暂无客观题。添加客观题后，系统将自动进行评分。</p>
              ) : (
                <div className="space-y-6">
                  {questions.map((q, qIndex) => (
                    <Card key={q.id} className="bg-gray-50">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">
                                {q.type === 'multiple_choice' ? '选择题' : '判断题'} {qIndex + 1}
                              </span>
                              <Input
                                type="number"
                                className="w-20 h-8"
                                placeholder="分数"
                                value={q.score}
                                onChange={(e) => updateQuestion(qIndex, 'score', Number(e.target.value))}
                                disabled={isPastDeadline}
                              />
                              <span className="text-sm text-gray-500">分</span>
                            </div>
                            <Textarea
                              placeholder="请输入题目内容..."
                              value={q.text}
                              onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                              disabled={isPastDeadline}
                              rows={2}
                            />
                          </div>
                          {!isPastDeadline && (
                            <Button type="button" variant="ghost" size="sm" className="text-red-500 ml-4" onClick={() => removeQuestion(qIndex)}>
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {q.type === 'multiple_choice' && (
                          <div className="space-y-2 pl-4">
                            {q.options.map((opt: string, optIndex: number) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={q.correctAnswer === String.fromCharCode(65 + optIndex)}
                                  onChange={() => updateQuestion(qIndex, 'correctAnswer', String.fromCharCode(65 + optIndex))}
                                  disabled={isPastDeadline}
                                />
                                <span className="text-sm font-medium w-6">{String.fromCharCode(65 + optIndex)}.</span>
                                <Input
                                  className="h-8 flex-1"
                                  placeholder={`选项 ${String.fromCharCode(65 + optIndex)}`}
                                  value={opt}
                                  onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                                  disabled={isPastDeadline}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {q.type === 'true_false' && (
                          <div className="flex space-x-4 pl-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correctAnswer === 'true'}
                                onChange={() => updateQuestion(qIndex, 'correctAnswer', 'true')}
                                disabled={isPastDeadline}
                              />
                              <span>正确</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correctAnswer === 'false'}
                                onChange={() => updateQuestion(qIndex, 'correctAnswer', 'false')}
                                disabled={isPastDeadline}
                              />
                              <span>错误</span>
                            </label>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 border-t pt-6">
              <Label>附件与参考资料</Label>
              {!isPastDeadline && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    multiple
                    onChange={handleFileUpload}
                  />
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-blue-600">
                      点击上传附件
                    </span>
                    <span className="text-xs text-gray-500">
                      支持 PDF, Word, Excel, ZIP 等格式
                    </span>
                  </Label>
                </div>
              )}

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">已上传附件：</h4>
                  <ul className="space-y-2">
                    {attachments.map((file, index) => (
                      <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
                        <span className="text-sm text-gray-600 truncate">{file.name}</span>
                        {!isPastDeadline && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate('/assignments')}>
                取消
              </Button>
              {!isPastDeadline && (
                <Button type="submit">
                  {isEdit ? '保存修改' : '发布作业'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
