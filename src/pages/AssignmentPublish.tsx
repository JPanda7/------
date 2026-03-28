import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useCourseStore } from '@/store/courseStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, Upload, X, PlusCircle, CheckCircle2, 
  Settings, FileText, Calendar, Target, HelpCircle, Trash2, AlertCircle, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [deadline, setDeadline] = useState('');
  const [totalScore, setTotalScore] = useState('100');
  const [weight, setWeight] = useState('10');
  const [gradingCriteria, setGradingCriteria] = useState('');
  const [allowLate, setAllowLate] = useState(false);
  const [latePenalty, setLatePenalty] = useState('0');
  const [isGroupAssignment, setIsGroupAssignment] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [batchMCScore, setBatchMCScore] = useState('10');
  const [batchTFScore, setBatchTFScore] = useState('5');
  const [courseId, setCourseId] = useState(courseIdFromUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    if (existingAssignment) {
      setTitle(existingAssignment.title || '');
      setDescription(existingAssignment.description || '');
      setRequirements(existingAssignment.requirements || '');
      setDeadline(existingAssignment.deadline ? new Date(existingAssignment.deadline).toISOString().slice(0, 16) : '');
      setTotalScore(existingAssignment.totalScore?.toString() || '100');
      setWeight(existingAssignment.weight?.toString() || '10');
      setGradingCriteria(existingAssignment.gradingCriteria || '');
      setAllowLate(existingAssignment.allowLate || false);
      setLatePenalty(existingAssignment.latePenalty?.toString() || '0');
      setIsGroupAssignment(existingAssignment.isGroupAssignment || false);
      setAttachments(existingAssignment.attachments || []);
      setQuestions(existingAssignment.questions || []);
      setCourseId(existingAssignment.courseId || '');
    }
  }, [existingAssignment]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAttachments = Array.from(files).map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
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
      correctAnswer: type === 'multiple_choice' ? 'A' : 'true',
      score: type === 'multiple_choice' ? Number(batchMCScore) : Number(batchTFScore)
    }]);
  };

  const applyBatchScore = (type: 'multiple_choice' | 'true_false', score: string) => {
    const numScore = Number(score);
    if (isNaN(numScore)) return;
    
    setQuestions(questions.map(q => 
      q.type === type ? { ...q, score: numScore } : q
    ));
    
    addNotification({
      title: '分值已同步',
      content: `已将所有${type === 'multiple_choice' ? '选择题' : '判断题'}的分值统一设置为 ${numScore} 分。`,
      targetRole: 'teacher',
      type: 'info'
    });
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

  const handleQuestionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseAndAddQuestions(text, file.name);
      e.target.value = '';
    };

    if (file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      addNotification({
        title: '格式解析提示',
        content: `正在解析 ${file.name}。非纯文本格式将进行模拟提取演示。`,
        targetRole: 'teacher',
        type: 'info'
      });
      const mockText = "1. [选择题] React的虚拟DOM主要作用是什么？\nA. 提升页面渲染性能\nB. 操作真实DOM\nC. 编写CSS更方便\nD. 增强安全性\n答案: A\n2. [判断题] Vue是一个后端的Node.js框架。\n答案: 错误";
      parseAndAddQuestions(mockText, file.name);
      e.target.value = '';
    }
  };

  const parseAndAddQuestions = (text: string, filename: string) => {
    let parsedCount = 0;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    let currentQ: any = null;
    let newQuestions = [...questions];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const qMatch = line.match(/^(\d+)[.、]\s*(?:\[(.*?)\])?\s*(.*)/);
        if (qMatch) {
            if (currentQ) {
                newQuestions.push(currentQ);
                parsedCount++;
            }
            const typeHint = qMatch[2] || '';
            const textContent = qMatch[3] || '';
            const isTF = typeHint.includes('判断') || textContent.includes('判断题');
            currentQ = {
                id: `q${Date.now()}_${i}`,
                type: isTF ? 'true_false' : 'multiple_choice',
                text: textContent,
                options: isTF ? undefined : ['', '', '', ''],
                correctAnswer: isTF ? 'true' : 'A',
                score: 10
            };
            continue;
        }

        if (currentQ) {
            const optMatch = line.match(/^([A-Da-d])[.、]\s*(.*)/);
            if (optMatch && currentQ.type === 'multiple_choice') {
                const idx = optMatch[1].toUpperCase().charCodeAt(0) - 65;
                if (idx >= 0 && idx < 4) {
                    currentQ.options[idx] = optMatch[2];
                }
            } else if (line.startsWith('答案') || line.toLowerCase().startsWith('answer')) {
                const ansStr = line.replace(/^答案[:：\s]*/, '').trim().toUpperCase();
                if (currentQ.type === 'true_false') {
                    currentQ.correctAnswer = ['对', '正确', 'TRUE', 'T'].includes(ansStr) ? 'true' : 'false';
                } else if (currentQ.type === 'multiple_choice') {
                    const ansMatch = ansStr.match(/[A-D]/);
                    if (ansMatch) currentQ.correctAnswer = ansMatch[0];
                }
            }
        }
    }
    
    if (currentQ) {
        newQuestions.push(currentQ);
        parsedCount++;
    }

    setQuestions(newQuestions);
    addNotification({
      title: '文档导入成功',
      content: `从 ${filename} 中成功解析出 ${parsedCount} 道题目。`,
      targetRole: 'teacher',
      type: 'success'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!courseId) {
        throw new Error('请选择所属课程');
      }

      if (!title || !description || !deadline || !totalScore) {
        throw new Error('请填写所有必填字段');
      }

      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        throw new Error('日期格式无效');
      }
      
      if (deadlineDate <= new Date() && !isEdit) {
        throw new Error('截止时间不能早于当前时间');
      }

      const assignmentData: any = {
        courseId,
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
        addNotification({
          title: `新作业发布: ${title}`,
          content: `《${currentCourse?.courseName || '课程'}》发布了新作业，截止时间为 ${deadlineDate.toLocaleString('zh-CN')}。`,
          targetRole: 'student',
          type: 'success'
        });
      }
      navigate(`/assignments?courseId=${courseId}`);
    } catch (err: any) {
      setError(err.message || '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assignments')} className="rounded-full bg-white shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{isEdit ? '编辑作业详情' : '创建新作业计划'}</h1>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-0.5">
              {currentCourse?.courseName || (courseId ? '课程加载中...' : '请在右侧选择所属课程')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm rounded-[40px] overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> 基本信息配置
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <div className="space-y-4">
                <Label htmlFor="title" className="text-xs font-black uppercase text-slate-400 ml-1">作业标题</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入一个能够清晰描述作业内容的标题..."
                  className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition-all font-bold"
                  disabled={isPastDeadline}
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="description" className="text-xs font-black uppercase text-slate-400 ml-1">作业简介 (显示在列表)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简要概括本次作业的任务目标..."
                  className="rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition-all font-medium min-h-[100px]"
                  disabled={isPastDeadline}
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="requirements" className="text-xs font-black uppercase text-slate-400 ml-1">详细任务要求</Label>
                <Textarea
                  id="requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="列出具体的完成步骤、参考资料及提交格式要求..."
                  className="rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition-all font-medium min-h-[200px]"
                  disabled={isPastDeadline}
                />
              </div>
            </CardContent>
          </Card>

          {/* Question Editor Section */}
          <Card className="border-none shadow-sm rounded-[40px] overflow-hidden bg-white">
             <CardHeader className="p-8 pb-6 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-600" /> 客观题题库
                  </CardTitle>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">系统全自动评分模块</p>
                </div>
                {!isPastDeadline && (
                  <div className="flex gap-2">
                    <input type="file" id="q-file" className="hidden" accept=".txt" onChange={handleQuestionUpload} />
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('q-file')?.click()} className="rounded-xl border-slate-100 font-bold text-xs h-10 px-4">
                       快捷导入 (TXT)
                    </Button>
                  </div>
                )}
             </CardHeader>
             <CardContent className="p-8 space-y-6">
                {!isPastDeadline && questions.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Label className="text-[9px] font-black uppercase text-blue-600 ml-1">选择题统一分值</Label>
                        <div className="flex gap-2 mt-1">
                          <Input 
                            type="number" 
                            value={batchMCScore} 
                            onChange={(e) => setBatchMCScore(e.target.value)} 
                            className="h-9 rounded-lg text-xs font-bold" 
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => applyBatchScore('multiple_choice', batchMCScore)}
                            className="h-9 px-3 rounded-lg border-blue-200 text-blue-600 font-bold text-[10px]"
                          >
                            应用
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 border-l border-blue-100 pl-4">
                      <div className="flex-1">
                        <Label className="text-[9px] font-black uppercase text-blue-600 ml-1">判断题统一分值</Label>
                        <div className="flex gap-2 mt-1">
                          <Input 
                            type="number" 
                            value={batchTFScore} 
                            onChange={(e) => setBatchTFScore(e.target.value)} 
                            className="h-9 rounded-lg text-xs font-bold" 
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => applyBatchScore('true_false', batchTFScore)}
                            className="h-9 px-3 rounded-lg border-blue-200 text-blue-600 font-bold text-[10px]"
                          >
                            应用
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {questions.length === 0 ? (
                  <div className="py-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <HelpCircle className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">暂无客观题，点击下方按钮添加</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {questions.map((q, idx) => (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={q.id} className="p-6 rounded-[32px] bg-slate-50/50 border border-slate-100 space-y-4">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-4 flex-1">
                              <span className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-xs font-black text-slate-900 shrink-0">
                                {idx + 1}
                              </span>
                              <div className="flex flex-col flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${q.type === 'multiple_choice' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {q.type === 'multiple_choice' ? '选择题' : '判断题'}
                                  </span>
                                </div>
                                <Input 
                                  placeholder="请输入题目正文..."
                                  value={q.text}
                                  onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                                  className="bg-transparent border-none shadow-none font-bold text-slate-700 h-10 px-0 focus-visible:ring-0"
                                />
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="relative">
                                <Input type="number" value={q.score} onChange={(e) => updateQuestion(idx, 'score', e.target.value)} className="w-20 h-10 rounded-xl font-black text-center pr-6" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">分</span>
                              </div>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(idx)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                           </div>
                        </div>

                        {q.type === 'multiple_choice' ? (
                          <div className="grid grid-cols-2 gap-4 pl-12">
                            {q.options.map((opt: string, oIdx: number) => {
                               const code = String.fromCharCode(65 + oIdx);
                               return (
                                 <div key={oIdx} className="flex items-center gap-3">
                                   <button 
                                     type="button" 
                                     onClick={() => updateQuestion(idx, 'correctAnswer', code)}
                                     className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                                       q.correctAnswer === code ? 'bg-blue-600 text-white' : 'bg-white text-slate-300 border border-slate-100'
                                     }`}
                                   >
                                     {code}
                                   </button>
                                   <Input 
                                     placeholder={`选项 ${code}`}
                                     value={opt}
                                     onChange={(e) => updateOption(idx, oIdx, e.target.value)}
                                     className="h-10 bg-white border-none shadow-none font-medium text-xs rounded-xl"
                                   />
                                 </div>
                               )
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 pl-12">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">正确答案:</span>
                            <div className="flex gap-2">
                              {['true', 'false'].map((val) => (
                                <Button
                                  key={val}
                                  type="button"
                                  variant="outline"
                                  onClick={() => updateQuestion(idx, 'correctAnswer', val)}
                                  className={`h-9 px-4 rounded-xl font-bold text-xs transition-all ${
                                    q.correctAnswer === val 
                                      ? 'bg-orange-500 text-white border-orange-500' 
                                      : 'bg-white text-slate-400'
                                  }`}
                                >
                                  {val === 'true' ? '正确' : '错误'}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {!isPastDeadline && (
                  <div className="pt-6 border-t border-slate-50 flex gap-4">
                    <Button 
                      type="button" 
                      onClick={() => addQuestion('multiple_choice')} 
                      className="flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-black font-black text-sm shadow-xl shadow-slate-200 active:scale-[0.98] transition-all"
                    >
                      <PlusCircle className="w-5 h-5 mr-3 text-blue-400" /> 新增选择题
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => addQuestion('true_false')} 
                      className="flex-1 h-14 rounded-2xl bg-white border-2 border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 text-slate-900 font-black text-sm active:scale-[0.98] transition-all"
                    >
                      <PlusCircle className="w-5 h-5 mr-3 text-orange-400" /> 新增判断题
                    </Button>
                  </div>
                )}
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Dynamic Settings */}
        <div className="space-y-8">
           <Card className="border-none shadow-sm rounded-[40px] overflow-hidden bg-slate-900 text-white">
             <CardHeader className="p-8 pb-4">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" /> 发布控制台
                </CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-2">
                     <Calendar className="w-3 h-3" /> 提交截止日期
                   </Label>
                   <Input 
                     type="datetime-local"
                     value={deadline}
                     onChange={(e) => setDeadline(e.target.value)}
                     className="h-14 bg-white/5 border-none rounded-[20px] font-bold text-white focus:ring-4 focus:ring-blue-500/20"
                     disabled={isPastDeadline}
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">满分分值</Label>
                      <Input 
                         type="number"
                         value={totalScore}
                         onChange={(e) => setTotalScore(e.target.value)}
                         className="h-14 bg-white/5 border-none rounded-[20px] font-black text-white text-center"
                      />
                   </div>
                   <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">总评权重 (%)</Label>
                      <Input 
                         type="number"
                         value={weight}
                         onChange={(e) => setWeight(e.target.value)}
                         className="h-14 bg-white/5 border-none rounded-[20px] font-black text-white text-center"
                      />
                   </div>
                </div>

                <div className="p-6 rounded-[28px] bg-white/5 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <Label className="text-sm font-black">允许逾期提交</Label>
                        <span className="text-[10px] text-slate-500 font-bold">截止后仍可完成作业</span>
                      </div>
                      <input type="checkbox" checked={allowLate} onChange={(e) => setAllowLate(e.target.checked)} className="w-5 h-5 accent-blue-500" />
                   </div>
                   {allowLate && (
                     <div className="pt-4 border-t border-white/5 space-y-4 animate-in fade-in zoom-in-95">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">每日逾期扣除分值</Label>
                        <Input type="number" value={latePenalty} onChange={(e) => setLatePenalty(e.target.value)} className="h-12 bg-white/10 border-none rounded-xl font-black text-center" />
                     </div>
                   )}
                </div>

                <div className="p-6 rounded-[28px] bg-white/5 flex items-center justify-between">
                   <div className="flex flex-col">
                      <Label className="text-sm font-black">小组协作模式</Label>
                      <span className="text-[10px] text-slate-500 font-bold">开启后支持成员共同提交</span>
                   </div>
                   <input type="checkbox" checked={isGroupAssignment} onChange={(e) => setIsGroupAssignment(e.target.checked)} className="w-5 h-5 accent-blue-500" />
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">所属课程</Label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="h-14 w-full bg-white/5 border-none rounded-[20px] font-bold text-white focus:ring-4 focus:ring-blue-500/20 px-4 outline-none"
                    disabled={isEdit && hasSubmissions}
                  >
                    <option value="" className="bg-slate-900">请选择课程</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-900">{c.courseName}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-500/10 text-red-400 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-500/20">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-[24px] bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-2xl shadow-blue-900/40 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    isEdit ? '保存更改并同步' : '确认为全班发布'
                  )}
                </Button>
             </CardContent>
           </Card>

           <Card className="border-none shadow-sm rounded-[40px] bg-white overflow-hidden p-8 space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">上传补充文件 (附件)</Label>
              <div className="border-2 border-dashed border-slate-50 rounded-[28px] p-8 text-center bg-slate-50/20 group hover:border-blue-200 transition-all">
                 <input type="file" id="f-upload" className="hidden" multiple onChange={handleFileUpload} />
                 <label htmlFor="f-upload" className="cursor-pointer">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                       <Upload className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-xs font-black text-slate-900">点击上传练习或要求附件</p>
                 </label>
              </div>
              {attachments.length > 0 && (
                <div className="space-y-2 mt-4">
                   {attachments.map((file, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                         <span className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">{file.name}</span>
                         <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(i)} className="w-6 h-6 rounded-lg text-slate-400">
                            <X className="w-3 h-3" />
                         </Button>
                      </div>
                   ))}
                </div>
              )}
           </Card>
        </div>
      </form>
    </div>
  );
}
