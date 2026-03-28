import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, BookOpen, CheckSquare, FileText, 
  Calendar, FolderOpen, Users, Clock, User,
  TrendingUp, Award, Zap, GraduationCap, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components
import Assignments from './Assignments';
import Exams from './Exams';
import Materials from './Materials';
import Attendance from './Attendance';

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { courses, fetchCourses } = useCourseStore();
  const [activeTab, setActiveTab] = useState('overview');

  const course = courses.find(c => c.id === id);

  useEffect(() => {
    if (courses.length === 0) {
      fetchCourses();
    }
  }, [fetchCourses, courses.length]);

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse">
        <div className="w-20 h-20 bg-slate-100 rounded-full mb-6" />
        <p className="text-slate-400 font-black tracking-tight uppercase">载入全息教研蓝图...</p>
      </div>
    );
  }

  const tabItems = [
    { id: 'overview', label: '详情概览', icon: BookOpen },
    { id: 'assignments', label: '课程作业', icon: CheckSquare },
    { id: 'exams', label: '阶段考试', icon: FileText },
    { id: 'materials', label: '教学资料', icon: FolderOpen },
    { id: 'attendance', label: '课堂考勤', icon: Calendar },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="relative overflow-hidden rounded-[40px] bg-slate-900 text-white p-12 lg:p-16 shadow-2xl flex flex-col lg:flex-row items-center gap-12 border border-white/5">
        {/* Background Visuals */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative flex-1 space-y-8 text-center lg:text-left">
           <div className="flex flex-col lg:flex-row items-center gap-6">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/courses')} 
                className="rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 h-14 w-14 shrink-0"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <div className="space-y-2">
                 <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                    <Badge className="bg-blue-600 hover:bg-blue-500 rounded-lg px-4 py-1 font-black tracking-widest border-none">
                      {course.courseCode}
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-blue-400 rounded-lg px-4 py-1 font-black tracking-widest uppercase">
                      ACTIVE SEMESTER
                    </Badge>
                 </div>
                 <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-white drop-shadow-sm">
                    {course.courseName}
                 </h1>
              </div>
           </div>

           <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 lg:gap-12">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                    <User className="w-5 h-5 text-blue-400" />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">授课教研组长</p>
                    <p className="text-lg font-black text-white">{course.teacherName || '资深教研组'}</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                    <Zap className="w-5 h-5 text-orange-400" />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">学分权能系数</p>
                    <p className="text-lg font-black text-white">{course.credit} CREDIT UNITS</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                    <Users className="w-5 h-5 text-green-400" />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">选课总研人数</p>
                    <p className="text-lg font-black text-white">45 STUDENTS</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Action / Progress Card */}
        <div className="w-full lg:w-80 relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[36px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
           <Card className="relative bg-white/10 border-white/10 backdrop-blur-xl rounded-[32px] p-8 space-y-8 overflow-hidden">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">学研进度追踪</h4>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                   <p className="text-5xl font-black text-white">75<span className="text-xl text-blue-400">%</span></p>
                   <p className="text-[10px] font-black text-slate-500 uppercase pb-1">COMPLETED</p>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: '75%' }}
                     transition={{ duration: 1.5, ease: 'easeOut' }}
                     className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" 
                   />
                </div>
              </div>
              <Button className="w-full h-14 rounded-2xl bg-white text-slate-900 hover:bg-blue-50 font-black text-sm active:scale-95 transition-all shadow-xl">
                 下载完整大纲
              </Button>
           </Card>
        </div>
      </div>

      <Tabs value={activeTab} className="space-y-8">
        <TabsList className="bg-white/50 backdrop-blur-sm border-none shadow-sm p-2 rounded-[28px] h-auto flex flex-wrap gap-2 w-fit mx-auto lg:mx-0">
          {tabItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <TabsTrigger 
                key={item.id} 
                value={item.id} 
                onClick={() => setActiveTab(item.id)}
                className={`px-8 py-4 rounded-[20px] transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-2xl scale-105' 
                    : 'text-slate-400 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-300'}`} />
                {item.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-8">
                <Card className="border-none shadow-sm rounded-[40px] overflow-hidden bg-white">
                  <CardHeader className="p-10 border-b border-slate-50">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                           <GraduationCap className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                           <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">核心教研方案</CardTitle>
                           <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">CURRICULUM ARCHITECTURE</CardDescription>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="p-10">
                    <div className="prose prose-slate max-w-none text-slate-600 leading-[1.8] font-medium text-lg">
                      <p className="mb-8">
                        本课程由顶尖专家团队匠心打造，深度融合业界前沿理论与实战案例。
                        旨在通过全链路的沉浸式实训，培养学员在大数据环境下的复合型财务决策与管控能力。
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
                         {[
                           { title: '多维数据建模', desc: '掌握企业级大数据清洗与多维分析体系控制点。' },
                           { title: '智能资产配置', desc: '学习如何利用AI算法进行最优资本结构测算与优化。' },
                           { title: '自动化审计链', desc: '构建基于区块链技术的透明化财务往来与内控系统。' },
                           { title: '预测性财务分析', desc: '运用机器学习模型实现高精度的现金流与损益预测。' }
                         ].map((item, i) => (
                           <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex gap-4">
                              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                              <div className="space-y-1">
                                 <h4 className="font-black text-slate-900 text-base">{item.title}</h4>
                                 <p className="text-sm text-slate-400 font-bold">{item.desc}</p>
                              </div>
                           </div>
                         ))}
                      </div>

                      <h3 className="text-xl font-black text-slate-900 mt-12 mb-6 flex items-center gap-3">
                         <Zap className="w-5 h-5 text-orange-500" /> 教学关键里程碑
                      </h3>
                      <div className="space-y-4">
                        {[
                          '第1阶段：构建基于Python的自动化财务治理闭环环境',
                          '第2阶段：深度渗透多源异构数据的ETL处理逻辑与异常监控',
                          '第3阶段：协同研判复杂业务场景下的价值驱动因子与业绩归因',
                          '第4阶段：实战交付全场景交互式财务决策领导驾驶舱'
                        ].map((step, i) => (
                          <div key={i} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                             <span className="text-xl font-black text-slate-200 group-hover:text-blue-200 transition-colors tracking-tighter w-12 flex-shrink-0">0{i+1}</span>
                             <p className="text-sm font-black text-slate-600">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <Card className="border-none shadow-sm rounded-[40px] bg-white p-10 space-y-10">
                   <div>
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8">核心考核指标项</h4>
                      <div className="space-y-6">
                         {[
                           { icon: Award, label: '平时作业', val: '40%', color: 'text-blue-600' },
                           { icon: CheckSquare, label: '期中研讨', val: '20%', color: 'text-orange-600' },
                           { icon: Target, label: '期末实托', val: '30%', color: 'text-indigo-600' },
                           { icon: Users, label: '出勤表现', val: '10%', color: 'text-green-600' },
                         ].map((item, i) => (
                           <div key={i} className="flex items-center justify-between group cursor-help">
                              <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-white group-hover:shadow-lg transition-all">
                                  <item.icon className={`w-4 h-4 ${item.color}`} />
                                </div>
                                <span className="text-sm font-black text-slate-600">{item.label}</span>
                              </div>
                              <span className="text-lg font-black text-slate-900">{item.val}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="pt-8 border-t border-slate-50">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">我的学研勋章集</h4>
                      <div className="flex flex-wrap gap-3">
                         {[1,2,3].map(i => (
                           <div key={i} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 grayscale hover:grayscale-0 cursor-pointer transition-all">
                             <Award className="w-5 h-5 text-blue-400" />
                           </div>
                         ))}
                         <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-200">
                           <Zap className="w-4 h-4" />
                         </div>
                      </div>
                   </div>

                   <Button className="w-full h-16 rounded-[24px] bg-slate-900 hover:bg-black font-black text-lg shadow-2xl active:scale-95 transition-all text-white">
                      进入教务管理后台 <ChevronRight className="w-5 h-5 ml-2" />
                   </Button>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assignments">
            <div className="bg-white/50 backdrop-blur-md rounded-[48px] p-2 border border-white/20 shadow-2xl">
              <div className="bg-white rounded-[40px] p-10 shadow-inner">
                <Assignments courseId={id} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="exams">
            <div className="bg-white/50 backdrop-blur-md rounded-[48px] p-2 border border-white/20 shadow-2xl">
              <div className="bg-white rounded-[40px] p-10 shadow-inner">
                <Exams courseId={id} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="materials">
            <div className="bg-white/50 backdrop-blur-md rounded-[48px] p-2 border border-white/20 shadow-2xl">
              <div className="bg-white rounded-[40px] p-10 shadow-inner">
                <Materials courseId={id} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attendance">
            <div className="bg-white/50 backdrop-blur-md rounded-[48px] p-2 border border-white/20 shadow-2xl">
              <div className="bg-white rounded-[40px] p-10 shadow-inner">
                <Attendance courseId={id} />
              </div>
            </div>
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
}
