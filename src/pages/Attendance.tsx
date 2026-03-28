import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore, AttendanceSession } from '@/store/attendanceStore';
import { useCourseStore } from '@/store/courseStore';
import { 
  Calendar, CheckCircle2, Clock, Users, Play, StopCircle, 
  MapPin, Scan, AlertCircle, ChevronRight, Activity, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export default function Attendance({ courseId }: { courseId?: string }) {
  const { user } = useAuthStore();
  const { courses, fetchCourses } = useCourseStore();
  const { sessions, loading, fetchSessions, addSession, closeSession, submitAttendance } = useAttendanceStore();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchSessions(courseId);
    if (isTeacher) fetchCourses();
  }, [fetchSessions, fetchCourses, courseId]);

  const activeSession = sessions.find(s => s.status === 'active' && (!courseId || s.courseId === courseId));
  const pastSessions = sessions.filter(s => s.status === 'closed' && (!courseId || s.courseId === courseId));

  const handleStartAttendance = async () => {
    const targetCourse = courseId ? courses.find(c => c.id === courseId) : courses[0];
    if (!targetCourse) return;
    
    await addSession({
      courseId: targetCourse.id,
      courseName: targetCourse.courseName,
      totalCount: 45,
    });
  };

  const handleSign = async () => {
    if (!activeSession || !user) return;
    setSubmitting(true);
    const result = await submitAttendance(activeSession.id, user.id);
    setFeedback({ type: result.success ? 'success' : 'error', msg: result.message });
    setSubmitting(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">终端考勤矩阵</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 italic">REAL-TIME ATTENDANCE TRACKING SYSTEM</p>
        </div>
        {isTeacher && !activeSession && (
          <Button 
            onClick={handleStartAttendance} 
            className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 font-black text-white active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 mr-3" /> 开启即时签到
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-none shadow-2xl rounded-[48px] bg-slate-900 overflow-hidden text-white relative">
              {/* Background Accents */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] -ml-20 -mb-20 pointer-events-none" />
              
              <CardContent className="p-12 relative z-10">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-12">
                  <div className="space-y-8 flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center px-4 py-2 bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping mr-3" />
                      LIVE SESSION ACTIVE
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">{activeSession.courseName}</h3>
                       <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest italic ml-1">TERMINAL ID: {activeSession.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center lg:justify-start gap-8">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                           <Clock className="w-4 h-4 text-blue-400" />
                         </div>
                         <div className="text-left">
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">截止时刻</p>
                           <p className="text-sm font-black">{format(new Date(activeSession.endTime), 'HH:mm')}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                           <MapPin className="w-4 h-4 text-orange-400" />
                         </div>
                         <div className="text-left">
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">地理定位</p>
                           <p className="text-sm font-black">研讨室 408A</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                           <Users className="w-4 h-4 text-green-400" />
                         </div>
                         <div className="text-left">
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">实时到课</p>
                           <p className="text-sm font-black">{activeSession.presentCount} / {activeSession.totalCount}</p>
                         </div>
                       </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-auto flex flex-col items-center">
                    {isTeacher ? (
                      <Button 
                        className="bg-white text-slate-900 hover:bg-red-50 hover:text-red-600 border-none rounded-[32px] h-20 px-12 font-black text-lg shadow-2xl transition-all active:scale-95 group"
                        onClick={() => closeSession(activeSession.id)}
                      >
                        <StopCircle className="w-6 h-6 mr-4 group-hover:animate-pulse" /> 结束系统采集
                      </Button>
                    ) : (
                      <div className="relative group">
                        <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <Button 
                          className="relative bg-blue-600 hover:bg-blue-500 text-white border-none rounded-full w-40 h-40 flex-col gap-2 shadow-2xl shadow-blue-900/40 active:scale-90 transition-all"
                          onClick={handleSign}
                          disabled={submitting}
                        >
                          <Scan className="w-12 h-12 mb-1 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{submitting ? 'VALIDATING...' : '点击鉴权签到'}</span>
                        </Button>
                        <AnimatePresence>
                          {feedback && (
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className={`absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-black uppercase tracking-widest px-6 py-2.5 rounded-full shadow-xl ${
                                feedback.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                              }`}
                            >
                              {feedback.msg}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: '加权到课率', val: '94.5%', sub: '较基准偏差 +1.2%', icon: Activity, theme: 'green' },
          { label: '累计采集周期', val: `${sessions.length} UNITS`, sub: '本学期运行总额', icon: Calendar, theme: 'blue' },
          { label: isTeacher ? '异常活跃度' : '个人效能阶梯', val: isTeacher ? '3 ALERTS' : 'TIER 1', sub: isTeacher ? '关注缺勤用户' : '排名 TOP 15%', icon: TrendingUp, theme: 'orange' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          const colors = {
             green: 'bg-green-50 text-green-600 shadow-green-900/5',
             blue: 'bg-blue-50 text-blue-600 shadow-blue-900/5',
             orange: 'bg-orange-50 text-orange-600 shadow-orange-900/5'
          }[stat.theme as 'green' | 'blue' | 'orange'];

          return (
            <Card key={i} className="border-none shadow-sm rounded-[40px] overflow-hidden bg-white group hover:shadow-xl transition-all">
              <CardContent className="p-8 flex items-center gap-6">
                <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center transition-transform group-hover:scale-110 ${colors}`}>
                  <Icon className="w-10 h-10" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.val}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase opacity-60 italic">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* History Log */}
      <Card className="border-none shadow-sm rounded-[48px] overflow-hidden bg-white">
        <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
           <div>
             <CardTitle className="text-xl font-black text-slate-900 tracking-tight uppercase">历史采集日志</CardTitle>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">TOTAL DATA POINTS: {pastSessions.length}</p>
           </div>
           <Button variant="ghost" size="icon" className="rounded-2xl">
              <Activity className="w-5 h-5 text-slate-200" />
           </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-w-[800px]">
            {loading ? (
              <div className="py-32 flex flex-col items-center animate-pulse">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">正在拉取全局日志记录...</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-12 px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-50">
                   <div className="col-span-4">目标课程单元</div>
                   <div className="col-span-3">时间解析记录</div>
                   <div className="col-span-2 text-center">覆盖权重</div>
                   <div className="col-span-3 text-right">采集效能分析</div>
                </div>
                <div className="divide-y divide-slate-50">
                  {pastSessions.map((s) => (
                    <div key={s.id} className="grid grid-cols-12 items-center px-10 py-6 hover:bg-slate-50 transition-all group">
                       <div className="col-span-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                             <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-700 tracking-tight">{s.courseName}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SUCCESSFUL SYNC</p>
                          </div>
                       </div>
                       <div className="col-span-3">
                          <p className="text-xs font-black text-slate-500 font-mono tracking-tighter">
                            {format(new Date(s.startTime), 'yyyy.MM.dd / HH:mm')}
                          </p>
                       </div>
                       <div className="col-span-2 flex justify-center">
                          <Badge variant="outline" className="rounded-lg px-2.5 py-1 bg-white border-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest">
                            {s.presentCount} / {s.totalCount}
                          </Badge>
                       </div>
                       <div className="col-span-3">
                         <div className="flex items-center justify-end">
                           <div className="w-32 bg-slate-100 rounded-full h-1.5 mr-4 overflow-hidden border border-slate-50">
                             <motion.div 
                               initial={{ width: 0 }}
                               whileInView={{ width: `${(s.presentCount / s.totalCount) * 100}%` }}
                               transition={{ duration: 1, ease: 'easeOut' }}
                               className="bg-blue-600 h-full rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]" 
                             />
                           </div>
                           <span className="text-[11px] font-black text-slate-900 font-mono italic">{((s.presentCount / (s.totalCount || 1)) * 100).toFixed(1)}%</span>
                           <ChevronRight className="w-4 h-4 ml-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
                         </div>
                       </div>
                    </div>
                  ))}
                  {pastSessions.length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                       <AlertCircle className="w-12 h-12 text-slate-100 mb-4" />
                       <h4 className="text-lg font-black text-slate-900">暂无合规采集数据</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">NO ARCHIVED LOGS IN SYSTEM KERNEL</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
