import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useExamStore } from '@/store/examStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, PlayCircle, Settings, BarChart, 
  Edit3, Calendar, Clock, AlertCircle, ChevronRight,
  TrendingUp, HelpCircle, FileText, CheckCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

export default function Exams({ courseId }: { courseId?: string }) {
  const { user } = useAuthStore();
  const { exams, fetchExams, loading } = useExamStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchExams(courseId);
    }
  }, [courseId, fetchExams]);

  const filteredExams = exams.filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusInfo = (exam: any) => {
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(start.getTime() + exam.duration * 60000);

    if (now < start) return { label: '未开始', color: 'bg-orange-50 text-orange-600', icon: Calendar };
    if (now > end) return { label: '已结束', color: 'bg-slate-50 text-slate-400', icon: CheckCircle };
    return { label: '进行中', color: 'bg-green-50 text-green-600 animate-pulse', icon: PlayCircle };
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      {/* Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="搜索阶段测验、期中/期末考试名称..."
              className="pl-12 h-14 rounded-2xl border-none bg-white shadow-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Button 
            onClick={() => navigate('/exams/new')}
            className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black font-black text-white shadow-xl active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5 mr-3" /> 创建考核任务
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 rounded-[40px] bg-white animate-pulse" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {filteredExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredExams.map((exam) => {
                const status = getStatusInfo(exam);
                const Icon = status.icon;
                return (
                  <motion.div
                    key={exam.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative bg-white rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                  >
                    {/* Status Badge */}
                    <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest ${status.color}`}>
                       {status.label}
                    </div>

                    <div className="space-y-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center transition-colors group-hover:bg-blue-50">
                        <FileText className="w-6 h-6 text-slate-600 transition-colors group-hover:text-blue-600" />
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight line-clamp-1 mb-2">
                           {exam.title}
                        </h3>
                        <div className="flex items-center gap-4 text-slate-400">
                           <div className="flex items-center gap-1.5">
                             <Clock className="w-3.5 h-3.5" />
                             <span className="text-[10px] font-black uppercase tracking-widest">{exam.duration} MINS</span>
                           </div>
                           <span className="opacity-20">•</span>
                           <div className="flex items-center gap-1.5">
                             <TrendingUp className="w-3.5 h-3.5" />
                             <span className="text-[10px] font-black uppercase tracking-widest">100 PTS</span>
                           </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 space-y-2">
                         <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>开始时间</span>
                            <Calendar className="w-3 h-3" />
                         </div>
                         <p className="text-sm font-black text-slate-700">
                            {format(new Date(exam.startTime), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                         </p>
                      </div>

                      <div className="flex gap-3 pt-2">
                        {user?.role === 'student' ? (
                          <Button 
                            className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-sm shadow-xl shadow-blue-900/10 active:scale-95 transition-all text-white"
                            disabled={status.label === '已结束'}
                          >
                            <PlayCircle className="w-4 h-4 mr-2" /> 进入考试
                          </Button>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 w-full">
                            <Button
                              variant="outline"
                              className="h-12 rounded-2xl border-slate-100 font-black text-xs hover:bg-slate-50 transition-all"
                              onClick={() => navigate(`/exams/${exam.id}/edit`)}
                              disabled={status.label === '已结束'}
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-2" /> 编辑
                            </Button>
                            <Button
                              className="h-12 rounded-2xl bg-slate-900 hover:bg-black font-black text-xs shadow-xl active:scale-95 transition-all text-white"
                              onClick={() => navigate(`/exams/${exam.id}/analysis`)}
                              disabled={status.label === '未开始'}
                            >
                              <BarChart className="w-3.5 h-3.5 mr-2" /> 统计
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10 blur-2xl" />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-32 bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-center">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                 <HelpCircle className="w-10 h-10 text-slate-200" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">暂无考试计划</h3>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-xs mx-auto">
                 当前课程阶段尚无任何正在进行或预排期的考核任务。
               </p>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
