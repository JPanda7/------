import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useChunkedUpload } from '@/hooks/useChunkedUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Upload, Pause, Play, X, Save, Send, 
  RefreshCw, FileText, CheckCircle2, AlertCircle, Info, Clock, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AssignmentSubmit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { assignments, submissions, fetchAssignmentById, fetchSubmissions, saveDraft, submitAssignment, loading } = useAssignmentStore();

  const assignment = assignments.find(a => a.id === id);
  const allMySubmissions = submissions.filter(s => s.assignmentId === id && s.studentId === user?.id);
  const history = allMySubmissions.filter(s => s.status !== 'draft').sort((a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime());
  const draft = allMySubmissions.find(s => s.status === 'draft');

  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const {
    progress,
    isUploading,
    isPaused,
    error: uploadError,
    uploadedUrl,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    file
  } = useChunkedUpload();

  useEffect(() => {
    if (id && user?.id) {
      fetchAssignmentById(id);
      fetchSubmissions(id, user.id);
    }
  }, [id, user?.id, fetchAssignmentById, fetchSubmissions]);

  useEffect(() => {
    if (draft) {
      setContent(draft.content || '');
      setFileName(draft.fileName || '');
      setAnswers(draft.answers || {});
    }
  }, [draft]);

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  if (loading && !assignment) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold tracking-tight">正在加载作业详情...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-slate-500 font-medium tracking-tight">作业不存在或已删除</p>
        <Button variant="link" onClick={() => navigate('/assignments')} className="mt-2 text-blue-600">返回列表</Button>
      </div>
    );
  }

  const now = new Date();
  const deadlineDate = new Date(assignment.deadline);
  const isPastDeadline = now > deadlineDate;
  const allowLate = assignment.allowLate || false;
  const isSubmissionClosed = assignment.status === 'closed' || (isPastDeadline && !allowLate);
  const hasSubmitted = history.length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 100 * 1024 * 1024) {
        showFeedback('error', '文件大小不能超过100MB');
        return;
      }
      setFileName(selectedFile.name);
      startUpload(selectedFile);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    if (hasSubmitted) {
      showFeedback('error', '作业已正式提交，无法保存为草稿');
      return;
    }
    try {
      await saveDraft({
        assignmentId: assignment.id,
        studentId: user.id,
        content,
        fileName,
        fileUrl: uploadedUrl || draft?.fileUrl,
        answers
      });
      showFeedback('success', '草稿已保存');
    } catch (err: any) {
      showFeedback('error', err.message || '保存失败');
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (isUploading) {
      showFeedback('info', '请等待文件上传完成');
      return;
    }
    if (isSubmissionClosed) {
      showFeedback('error', '提交通道已关闭');
      return;
    }
    if (hasSubmitted) {
      showFeedback('error', '您已经提交过该作业，无法重复提交');
      return;
    }
    try {
      await submitAssignment({
        assignmentId: assignment.id,
        studentId: user.id,
        content,
        fileName,
        fileUrl: uploadedUrl || draft?.fileUrl,
        isLate: isPastDeadline,
        answers
      });
      showFeedback('success', '作业提交成功！');
      // Navigate back after a short delay
      setTimeout(() => navigate('/assignments'), 1500);
    } catch (err: any) {
      showFeedback('error', err.message || '提交失败');
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = assignment.questions?.length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-[20px] shadow-2xl flex items-center gap-3 font-bold border ${
              feedback.type === 'success' ? 'bg-green-600 text-white border-green-500' :
              feedback.type === 'error' ? 'bg-red-600 text-white border-red-500' :
              'bg-blue-600 text-white border-blue-500'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
             feedback.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
             <Info className="w-5 h-5" />}
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assignments')} className="rounded-full bg-white shadow-sm hover:shadow-md">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{assignment.title}</h1>
            <p className="text-sm font-bold text-slate-400 mt-0.5 tracking-tight uppercase">
              截止日期: {deadlineDate.toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="px-4 py-1.5 rounded-full border-slate-200 bg-white font-bold text-slate-600">
             总分 {assignment.totalScore}
           </Badge>
           {isPastDeadline && allowLate && (
             <Badge variant="destructive" className="px-4 py-1.5 rounded-full font-bold">
               迟交
             </Badge>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Info & Requirements */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" /> 作业说明
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="prose prose-slate max-w-none text-sm font-medium text-slate-600 leading-relaxed">
                <p className="whitespace-pre-wrap">{assignment.description}</p>
              </div>

              {assignment.requirements && (
                <div className="p-6 rounded-[24px] bg-blue-50/50 border border-blue-100/50 space-y-3">
                  <h4 className="font-black text-blue-900 text-xs uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> 详细要求
                  </h4>
                  <p className="text-blue-800/80 text-sm whitespace-pre-wrap leading-relaxed">{assignment.requirements}</p>
                </div>
              )}

              {assignment.gradingCriteria && (
                <div className="p-6 rounded-[24px] bg-orange-50/50 border border-orange-100/50 space-y-3">
                  <h4 className="font-black text-orange-900 text-xs uppercase tracking-widest flex items-center gap-2">
                    <Award className="w-4 h-4" /> 评分标准
                  </h4>
                  <p className="text-orange-800/80 text-sm whitespace-pre-wrap leading-relaxed">{assignment.gradingCriteria}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {history.length > 0 && (
            <Card className="border-none shadow-sm bg-slate-900 rounded-[32px] text-white overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-lg font-black flex justify-between items-center">
                  <span>历史提交记录</span>
                  <Badge className="bg-white/10 text-white border-white/5">{history.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-4">
                {history.map((sub, i) => (
                  <div key={sub.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-bold">第 {history.length - i} 次提交</p>
                      {sub.status === 'graded' ? (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-none font-black">{sub.score} 分</Badge>
                      ) : (
                        <Badge variant="outline" className="text-white/40 border-white/10 font-bold">已提交</Badge>
                      )}
                    </div>
                    {sub.status === 'graded' && sub.feedback && (
                      <p className="text-[10px] text-white/60 italic line-clamp-2 mt-2">“{sub.feedback}”</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Submission Form */}
        <div className="lg:col-span-2 space-y-8">
          {(!isSubmissionClosed && !hasSubmitted) ? (
            <div className="space-y-8">
               {/* Objective Questions Section */}
               {totalQuestions > 0 && (
                 <Card className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden">
                    <CardHeader className="p-8 pb-6 border-b border-slate-50 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-black text-slate-900">客观题答题区</CardTitle>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                          系统将基于此部分答案自动评分
                        </p>
                      </div>
                      <div className="text-right">
                         <p className="text-2xl font-black text-blue-600">{answeredCount}/{totalQuestions}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">进度详情</p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      {assignment.questions?.map((q, qIdx) => (
                        <div key={q.id} className="space-y-4 animate-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${qIdx * 100}ms` }}>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-800 flex gap-3">
                              <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs shrink-0">{qIdx + 1}</span>
                              {q.text}
                            </h4>
                            <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none font-bold text-[10px]">
                              {q.score} 分
                            </Badge>
                          </div>

                          {q.type === 'multiple_choice' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                              {q.options?.map((opt, optIdx) => {
                                const val = String.fromCharCode(65 + optIdx);
                                const isSelected = answers[q.id] === val;
                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => setAnswers({...answers, [q.id]: val})}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-sm font-bold text-left ${
                                      isSelected 
                                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-lg shadow-blue-100/50' 
                                        : 'border-slate-50 hover:bg-slate-50 text-slate-500'
                                    }`}
                                  >
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>{val}</span>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {q.type === 'true_false' && (
                             <div className="flex gap-4 pl-9">
                                {['true', 'false'].map(val => {
                                  const isSelected = answers[q.id] === val;
                                  return (
                                    <button
                                      key={val}
                                      onClick={() => setAnswers({...answers, [q.id]: val})}
                                      className={`flex-1 flex items-center justify-center h-14 rounded-2xl border-2 transition-all font-bold ${
                                        isSelected 
                                          ? 'border-blue-600 bg-blue-50/50 text-blue-700' 
                                          : 'border-slate-50 hover:bg-slate-50 text-slate-500'
                                      }`}
                                    >
                                      {val === 'true' ? '正确' : '错误'}
                                    </button>
                                  );
                                })}
                             </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                 </Card>
               )}

               {/* subjective Section */}
               <Card className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden">
                  <CardHeader className="p-8 pb-6 border-b border-slate-50">
                    <CardTitle className="text-xl font-black text-slate-900">主观题/文件提交</CardTitle>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest text-balance">
                      请输入您的详细答案或上传相关的附件资料
                    </p>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">详细正文 (非必填)</label>
                      <textarea
                        className="w-full min-h-[300px] p-6 rounded-[24px] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700"
                        placeholder="在此处输入您的答案正文..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">附件资料</label>
                        <span className="text-[10px] font-bold text-slate-300">MAX 100MB</span>
                      </div>

                      <div className="relative group">
                         <input
                           type="file"
                           className="hidden"
                           id="file-input"
                           onChange={handleFileChange}
                           disabled={isUploading}
                         />
                         
                         {!fileName && !file ? (
                           <label 
                             htmlFor="file-input"
                             className="flex flex-col items-center justify-center py-10 rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50/30 hover:bg-blue-50/30 hover:border-blue-200 transition-all cursor-pointer"
                           >
                             <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                               <Upload className="w-6 h-6 text-blue-600" />
                             </div>
                             <p className="text-sm font-bold text-slate-900">点击上传练习附件</p>
                             <p className="text-xs text-slate-400 mt-1">支持 PDF, Word, Excel 及常见压缩包</p>
                           </label>
                         ) : (
                           <div className="p-6 rounded-[32px] bg-slate-900 text-white relative overflow-hidden group">
                              <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <FileText className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold truncate max-w-[200px]">{file?.name || fileName}</p>
                                    <p className="text-[10px] text-white/40 font-mono">
                                      {isUploading ? `${progress}% UPLOADING...` : uploadedUrl ? 'COMPLETED' : 'READY TO SUBMIT'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {isUploading && (
                                    <Button variant="ghost" size="icon" onClick={isPaused ? resumeUpload : pauseUpload} className="rounded-full bg-white/10 hover:bg-white/20">
                                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="icon" onClick={() => { cancelUpload(); setFileName(''); }} className="rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400">
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              {isUploading && <Progress value={progress} className="h-1.5 bg-white/10 absolute bottom-0 left-0 right-0 rounded-none overflow-hidden" />}
                              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
                           </div>
                         )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-0 flex flex-col md:flex-row gap-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-14 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                      onClick={handleSaveDraft}
                    >
                      <Save className="w-4 h-4 mr-2" /> 暂存草稿
                    </Button>
                    <Button 
                      className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 font-bold"
                      onClick={handleSubmit}
                      disabled={isUploading}
                    >
                      <Send className="w-4 h-4 mr-2" /> 正式提交作业
                    </Button>
                  </CardFooter>
               </Card>
            </div>
          ) : (
            <Card className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden">
               <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {hasSubmitted ? '作业已在档' : '提交通道已关闭'}
                  </h3>
                  <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">
                    {hasSubmitted 
                      ? '您已于此模块成功提交作业，请耐心等待教师批改。如需修改，请线下联系课程助教。' 
                      : '该作业提交通道现已关闭，可能是由于截止时间已过或教师手动设置。'}
                  </p>
                  <Button variant="outline" className="mt-8 rounded-2xl px-8" onClick={() => navigate('/assignments')}>
                    返回系统列表
                  </Button>
               </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
