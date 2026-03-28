import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useChunkedUpload } from '@/hooks/useChunkedUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Upload, Pause, Play, X, Save, Send, RefreshCw, FileText } from 'lucide-react';

export default function AssignmentSubmit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { assignments, submissions, fetchAssignmentById, saveDraft, submitAssignment } = useAssignmentStore();

  const assignment = assignments.find(a => a.id === id);
  const allMySubmissions = submissions.filter(s => s.assignmentId === id && s.studentId === user?.id);
  const history = allMySubmissions.filter(s => s.status !== 'draft').sort((a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime());
  const draft = allMySubmissions.find(s => s.status === 'draft');

  const [content, setContent] = useState(draft?.content || '');
  const [fileName, setFileName] = useState(draft?.fileName || '');
  const [answers, setAnswers] = useState<Record<string, string>>(draft?.answers || {});

  const {
    progress,
    isUploading,
    isPaused,
    error,
    uploadedUrl,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    file
  } = useChunkedUpload();
  useEffect(() => {
    if (id) {
      fetchAssignmentById(id);
    }
  }, [id, fetchAssignmentById]);

  useEffect(() => {
    if (draft) {
      setContent(draft.content || '');
      setFileName(draft.fileName || '');
      setAnswers(draft.answers || {});
    }
  }, [draft]);

  if (!assignment) {
    return <div className="p-8 text-center text-gray-500">作业不存在</div>;
  }

  const now = new Date();
  const deadlineDate = new Date(assignment.deadline);
  const isPastDeadline = now > deadlineDate;
  const allowLate = assignment.allowLate || false;
  const isSubmissionClosed = assignment.status === 'closed' || (isPastDeadline && !allowLate);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 100 * 1024 * 1024) {
        alert('文件大小不能超过100MB');
        return;
      }
      setFileName(selectedFile.name);
      startUpload(selectedFile);
    }
  };

  const handleSaveDraft = () => {
    if (!user) return;
    saveDraft({
      assignmentId: assignment.id,
      studentId: user.id,
      content,
      fileName,
      fileUrl: uploadedUrl || draft?.fileUrl,
      answers
    });
    alert('草稿已保存');
  };

  const handleSubmit = () => {
    if (!user) return;
    if (isUploading) {
      alert('请等待文件上传完成');
      return;
    }
    if (isSubmissionClosed) {
      alert('提交通道已关闭');
      return;
    }
    submitAssignment({
      assignmentId: assignment.id,
      studentId: user.id,
      content,
      fileName,
      fileUrl: uploadedUrl || draft?.fileUrl,
      isLate: isPastDeadline,
      answers
    });
    alert('作业已提交');
    setContent('');
    setFileName('');
    setAnswers({});
    cancelUpload();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/assignments')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回作业列表
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{assignment.title}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">总分: {assignment.totalScore}</Badge>
            {assignment.weight && <Badge variant="outline">权重: {assignment.weight}%</Badge>}
            {assignment.allowLate && <Badge variant="warning">允许迟交</Badge>}
            {assignment.allowLate && assignment.latePenalty ? <Badge variant="destructive">迟交扣分: {assignment.latePenalty}分/天</Badge> : null}
            {assignment.isGroupAssignment && <Badge variant="secondary">小组作业</Badge>}
          </div>
          <CardDescription className="mt-2">截止时间: {deadlineDate.toLocaleString('zh-CN')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">作业描述：</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
          </div>

          {assignment.requirements && (
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2">详细要求：</h4>
              <p className="text-blue-800 whitespace-pre-wrap text-sm">{assignment.requirements}</p>
            </div>
          )}

          {assignment.gradingCriteria && (
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
              <h4 className="font-medium text-yellow-900 mb-2">评分标准：</h4>
              <p className="text-yellow-800 whitespace-pre-wrap text-sm">{assignment.gradingCriteria}</p>
            </div>
          )}

          {assignment.attachments && assignment.attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">附件与参考资料：</h4>
              <ul className="space-y-2">
                {assignment.attachments.map((fileObj, index) => (
                  <li key={index} className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-100">
                    <span className="text-sm text-blue-600 hover:underline cursor-pointer truncate">{fileObj.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {history.length > 0 && (
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-medium text-gray-900">提交记录</h3>
              <div className="space-y-4">
                {history.map((sub, index) => (
                  <Card key={sub.id} className="bg-gray-50">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-gray-900">第 {history.length - index} 次提交</span>
                          <span className="text-sm text-gray-500 ml-2">{new Date(sub.submitTime).toLocaleString('zh-CN')}</span>
                        </div>
                        <div className="flex space-x-2">
                          {sub.isLate && <Badge variant="warning">迟交</Badge>}
                          {sub.status === 'graded' ? (
                            <Badge variant="success">已批改 ({sub.score}分)</Badge>
                          ) : (
                            <Badge variant="secondary">已提交</Badge>
                          )}
                        </div>
                      </div>

                      {sub.status === 'graded' && (
                        <div className="bg-green-50 p-3 rounded-md border border-green-100 text-sm space-y-2">
                          <div className="flex justify-between font-medium text-green-900">
                            <span>得分详情：</span>
                            <span>总分：{sub.score}</span>
                          </div>
                          <div className="text-green-800 flex justify-between">
                            <span>客观题自动评分：{sub.autoScore || 0}分</span>
                            <span>教师人工评分：{sub.manualScore || 0}分</span>
                          </div>
                          {sub.isLate && assignment.latePenalty && (
                            <div className="text-red-600">
                              迟交扣分：-{assignment.latePenalty}分
                            </div>
                          )}
                          {sub.feedback && (
                            <div className="mt-2 pt-2 border-t border-green-200 text-green-800">
                              <span className="font-medium">教师评语：</span>
                              <p className="mt-1 whitespace-pre-wrap">{sub.feedback}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {sub.content && (
                        <div className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200 whitespace-pre-wrap mt-2">
                          {sub.content}
                        </div>
                      )}
                      {sub.fileName && (
                        <div className="flex items-center text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-100 mt-2">
                          <FileText className="w-4 h-4 mr-2" />
                          {sub.fileName}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-xs text-gray-500">提交记录不可删除，如有问题请联系教师处理。</p>
            </div>
          )}

          {!isSubmissionClosed ? (
            <div className="space-y-6 mt-8 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900">新增提交</h3>

              {assignment.questions && assignment.questions.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">客观题部分</h4>
                  {assignment.questions.map((q, index) => (
                    <Card key={q.id} className="bg-white">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900">{index + 1}. {q.text}</span>
                          <span className="text-sm text-gray-500">({q.score}分)</span>
                        </div>

                        {q.type === 'multiple_choice' && q.options && (
                          <div className="space-y-2 pl-4">
                            {q.options.map((opt, optIndex) => {
                              const value = String.fromCharCode(65 + optIndex);
                              return (
                                <label key={optIndex} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`q-${q.id}`}
                                    value={value}
                                    checked={answers[q.id] === value}
                                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                    className="text-blue-600 focus:ring-blue-500"
                                  />
                                  <span>{value}. {opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'true_false' && (
                          <div className="flex space-x-6 pl-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                value="true"
                                checked={answers[q.id] === 'true'}
                                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span>正确</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                value="false"
                                checked={answers[q.id] === 'false'}
                                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                className="text-blue-600 focus:ring-blue-500"
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">作业内容</label>
                <textarea
                  className="w-full min-h-[150px] p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="请输入作业内容..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">附件上传</label>

                <div className="flex items-center space-x-4">
                  <Button variant="outline" asChild className="cursor-pointer">
                    <label>
                      <Upload className="w-4 h-4 mr-2" />
                      选择文件
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif"
                      />
                    </label>
                  </Button>
                  <span className="text-sm text-gray-500">支持断点续传和分片上传，最大 100MB</span>
                </div>

                {(fileName || file) && (
                  <div className="mt-4 p-4 border border-gray-200 rounded-md bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[300px]">
                        {file?.name || fileName}
                      </span>
                      <div className="flex items-center space-x-2">
                        {isUploading && !isPaused && !error && (
                          <Button variant="ghost" size="icon" onClick={pauseUpload} title="暂停">
                            <Pause className="w-4 h-4 text-gray-500" />
                          </Button>
                        )}
                        {isPaused && !error && (
                          <Button variant="ghost" size="icon" onClick={resumeUpload} title="继续">
                            <Play className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                        {(isUploading || isPaused || uploadedUrl || error) && (
                          <Button variant="ghost" size="icon" onClick={() => { cancelUpload(); setFileName(''); }} title="取消">
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {(isUploading || isPaused || error) && (
                      <div className={`space-y-2 mt-3 p-4 rounded-lg border ${error ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-sm font-medium ${error ? 'text-red-900' : 'text-blue-900'}`}>
                            {error ? error : isPaused ? '上传已暂停' : '文件分片上传中...'}
                          </span>
                          {!error && <span className="text-lg font-bold text-blue-700">{progress}%</span>}
                        </div>
                        {!error && <Progress value={progress} className="h-3 bg-blue-200/50" />}
                        <div className="flex justify-between items-center text-xs">
                          <span className={error ? 'text-red-600/80' : 'text-blue-600/80'}>
                            {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                          </span>
                          {error ? (
                            <Button variant="outline" size="sm" onClick={retryUpload} className="h-7 text-red-600 border-red-200 hover:bg-red-100">
                              <RefreshCw className="w-3 h-3 mr-1" />
                              手动重试
                            </Button>
                          ) : (
                            <span className="text-blue-600/80">{progress === 100 ? '即将完成...' : '请勿关闭页面'}</span>
                          )}
                        </div>
                      </div>
                    )}
                    {uploadedUrl && !isUploading && !isPaused && !error && (
                      <div className="text-xs text-green-600 font-medium">上传完成</div>
                    )}
                    {!file && fileName && !isUploading && !uploadedUrl && !error && (
                      <div className="text-xs text-gray-500 font-medium">已保存的附件</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-8 p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-200 flex items-center">
              <span className="font-medium">提交通道已关闭。</span>
              {isPastDeadline && !allowLate && <span className="ml-2 text-sm">该作业已过截止时间，且不允许迟交。</span>}
              {assignment.status === 'closed' && <span className="ml-2 text-sm">教师已关闭该作业的提交。</span>}
            </div>
          )}
        </CardContent>
        {!isSubmissionClosed && (
          <CardFooter className="flex justify-between border-t border-gray-100 pt-6">
            <div className="text-sm text-gray-500">
              {draft ? '状态：草稿' : '状态：未提交'}
              {isPastDeadline && <span className="ml-2 text-yellow-600 font-medium">(当前提交将记为迟交)</span>}
            </div>
            <div className="space-x-4">
              <Button variant="outline" onClick={handleSaveDraft}>
                <Save className="w-4 h-4 mr-2" />
                保存草稿
              </Button>
              <Button onClick={handleSubmit} disabled={(isUploading && !isPaused) || !!error}>
                <Send className="w-4 h-4 mr-2" />
                提交作业
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
