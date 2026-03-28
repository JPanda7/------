import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, Save, CheckCircle, FileText, Users, 
  ChevronRight, Download, Award, MessageSquare, Calculator, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';
import { motion, AnimatePresence } from 'framer-motion';

export default function AssignmentGrading() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { assignments, submissions, fetchAssignmentById, fetchSubmissions, batchGradeSubmissions } = useAssignmentStore();

  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<string, { manualScore: number; feedback: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  const assignment = assignments.find(a => a.id === id);
  
  useEffect(() => {
    if (id) {
      fetchAssignmentById(id);
      fetchSubmissions(id);
    }
  }, [id, fetchAssignmentById, fetchSubmissions]);

  // Filter valid submissions (latest for each student)
  const assignmentSubmissions = submissions
    .filter(s => s.assignmentId === id && s.status !== 'draft')
    .sort((a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime());

  const latestSubmissions = Array.from(
    new Map(assignmentSubmissions.map(s => [s.studentId, s])).values()
  ) as any[];

  useEffect(() => {
    if (user?.role !== 'teacher' && user?.role !== 'admin') {
      navigate('/assignments');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (latestSubmissions.length > 0 && !selectedSubId) {
      setSelectedSubId(latestSubmissions[0].id);
    }
  }, [latestSubmissions, selectedSubId]);

  useEffect(() => {
    const initialGrades: Record<string, { manualScore: number; feedback: string }> = {};
    latestSubmissions.forEach(sub => {
      initialGrades[sub.id] = {
        manualScore: sub.manualScore || 0,
        feedback: sub.feedback || ''
      };
    });
    setGrades(initialGrades);
  }, [submissions, id]);

  const handleGradeChange = (submissionId: string, field: 'manualScore' | 'feedback', value: any) => {
    setGrades(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value
      }
    }));
  };

  const handleSave = async (subId: string) => {
    setIsSaving(true);
    const data = grades[subId];
    await batchGradeSubmissions([{
      id: subId,
      manualScore: Number(data.manualScore),
      feedback: data.feedback
    }]);
    setIsSaving(false);
  };

  const calculateTotal = (sub: any, manualScore: number) => {
    let total = (sub.autoScore || 0) + Number(manualScore);
    if (sub.isLate && assignment?.latePenalty) {
      total = Math.max(0, total - assignment.latePenalty);
    }
    return total;
  };

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse">
        <div className="w-16 h-16 bg-slate-100 rounded-full mb-4" />
        <p className="text-slate-400 font-bold tracking-tight">正在加载批改中心...</p>
      </div>
    );
  }

  const selectedSub = latestSubmissions.find(s => s.id === selectedSubId);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assignments')} className="rounded-full bg-white shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              批改工作台
            </h1>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">{assignment.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
             <p className="text-xl font-black text-slate-900 leading-none">{latestSubmissions.length}</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">待批改总数</p>
           </div>
           <Button className="rounded-2xl bg-slate-900 hover:bg-black font-bold h-12 px-6 shadow-xl active:scale-95 transition-all">
             导出成绩单 <Download className="w-4 h-4 ml-2" />
           </Button>
        </div>
      </div>

      <div className="flex-grow flex gap-8 overflow-hidden min-h-0">
        {/* Left Bar: Students */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
           <Card className="flex-grow border-none shadow-sm rounded-[32px] overflow-hidden bg-white flex flex-col">
              <CardHeader className="p-6 border-b border-slate-50 shrink-0">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">已提交学生</CardTitle>
              </CardHeader>
              <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {latestSubmissions.map((sub: any) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubId(sub.id)}
                    className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      selectedSubId === sub.id 
                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 scale-[1.02]' 
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${
                      selectedSubId === sub.id ? 'bg-white/20' : 'bg-slate-50'
                    }`}>
                      {sub.studentName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-black tracking-tight">{sub.studentName || '未知学生'}</p>
                      <p className={`text-[10px] font-bold uppercase mt-0.5 opacity-60 ${
                        selectedSubId === sub.id ? 'text-white' : 'text-slate-400'
                      }`}>
                        {format(new Date(sub.submitTime), 'MM-dd HH:mm')}
                      </p>
                    </div>
                    {sub.status === 'graded' ? (
                       <CheckCircle className={`w-4 h-4 ${selectedSubId === sub.id ? 'text-white' : 'text-green-500'}`} />
                    ) : (
                       <div className={`w-2 h-2 rounded-full ${selectedSubId === sub.id ? 'bg-white' : 'bg-orange-500'} animate-pulse`} />
                    )}
                  </button>
                ))}
              </div>
           </Card>
        </div>

        {/* Right Area: Evaluation Section */}
        <div className="flex-grow flex gap-8 min-w-0">
          <AnimatePresence mode="wait">
            {selectedSub ? (
              <motion.div 
                key={selectedSub.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-grow flex gap-8 min-w-0"
              >
                {/* Content Card */}
                <Card className="flex-grow border-none shadow-sm rounded-[40px] overflow-hidden bg-white flex flex-col min-w-0">
                   <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between border-b border-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black text-slate-900 tracking-tight">
                            {selectedSub.fileName || '系统文本提交'}
                          </CardTitle>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest">SUBMISSION ARTIFACT</p>
                        </div>
                      </div>
                      {selectedSub.isLate && (
                        <Badge variant="destructive" className="rounded-full px-4 h-8 font-black uppercase tracking-tight">
                           LATE SUBMISSION -{assignment.latePenalty}
                        </Badge>
                      )}
                   </CardHeader>
                   <CardContent className="p-8 flex-grow overflow-y-auto custom-scrollbar">
                      {selectedSub.content ? (
                        <div className="bg-slate-50/50 p-10 rounded-[32px] border border-slate-100 font-medium text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                           {selectedSub.content}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                           <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                             <Download className="w-10 h-10 text-blue-600" />
                           </div>
                           <h4 className="text-xl font-black text-slate-900 tracking-tight">文档附件已上传</h4>
                           <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">
                             该学生上传了离线文档作为提交结果，请点击下方按钮下载并在本地完成评审。
                           </p>
                           <Button variant="outline" className="h-14 px-8 rounded-2xl border-blue-200 text-blue-600 font-black mt-4 hover:bg-blue-50">
                             下载演示附件 ({selectedSub.fileName})
                           </Button>
                        </div>
                      )}
                   </CardContent>
                </Card>

                {/* Score Card */}
                <div className="w-96 flex-shrink-0 space-y-6">
                  <Card className="border-none shadow-sm rounded-[40px] bg-slate-900 text-white overflow-hidden p-8 space-y-8">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                        <Calculator className="w-4 h-4" /> 得分结算面板
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-5 rounded-[24px] bg-white/5 border border-white/5">
                            <p className="text-[10px] font-bold text-white/40 uppercase mb-1">自动评估</p>
                            <p className="text-2xl font-black">{selectedSub.autoScore || 0}</p>
                         </div>
                         <div className="p-5 rounded-[24px] bg-white/5 border border-white/5">
                            <p className="text-[10px] font-bold text-white/40 uppercase mb-1">满分限额</p>
                            <p className="text-2xl font-black">{assignment.totalScore}</p>
                         </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">人工考评赋分</label>
                       <div className="relative group">
                         <Input 
                           type="number"
                           className="h-20 bg-white/10 border-white/5 rounded-[24px] text-4xl font-black pl-8 pr-16 focus:ring-4 focus:ring-blue-500/20 transition-all border-none"
                           value={grades[selectedSub.id]?.manualScore || 0}
                           onChange={(e) => handleGradeChange(selectedSub.id, 'manualScore', e.target.value)}
                         />
                         <span className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20 font-black text-lg">PTS</span>
                       </div>
                       <div className="flex justify-between items-center px-2">
                         <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">最终核对总得分</p>
                         <p className="text-3xl font-black text-blue-500">
                           {calculateTotal(selectedSub, grades[selectedSub.id]?.manualScore || 0)}
                         </p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> 批改指导评语
                       </label>
                       <Textarea 
                         placeholder="输入批改建议或对该学生的改进指导意见..."
                         className="min-h-[180px] bg-white/5 border-white/5 rounded-[24px] p-6 text-sm font-medium focus:ring-4 focus:ring-blue-500/20 transition-all border-none resize-none"
                         value={grades[selectedSub.id]?.feedback || ''}
                         onChange={(e) => handleGradeChange(selectedSub.id, 'feedback', e.target.value)}
                       />
                    </div>

                    <Button 
                      className="w-full h-16 rounded-[24px] bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-2xl shadow-blue-900/40 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      onClick={() => handleSave(selectedSub.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><Save className="w-5 h-5" /> 保存本人考评记录</>
                      )}
                    </Button>
                  </Card>
                </div>
              </motion.div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-20 text-center">
                 <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Users className="w-10 h-10 text-slate-200" />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">暂无已选学生</h3>
                 <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">
                   请在左侧面板中选择一个已提交作业的学生，开始您的专业批改与评价流程。
                 </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
