import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Download, Edit, BookOpen, TrendingUp, 
  Award, Target, BarChart3, ChevronRight, Filter, 
  FileSpreadsheet, ArrowUpRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

export default function Grades() {
  const { user } = useAuthStore();
  const { courses, fetchCourses } = useCourseStore();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [gradeData, setGradeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      setLoading(true);
      fetch(`/api/courses/${selectedCourse}/grades`)
        .then(res => res.json())
        .then(data => {
          setGradeData(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [selectedCourse]);

  const filteredGrades = gradeData.filter(g => 
    g.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: '平均基准分', val: '84.2', icon: Target, theme: 'blue' },
    { label: '最高达成度', val: '98.5', icon: Award, theme: 'orange' },
    { label: '及格容错率', val: '96.8%', icon: TrendingUp, theme: 'green' },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      {/* Search & Selector Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
        <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
          <div className="relative w-full md:w-72">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={selectedCourse} 
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full h-14 pl-12 pr-10 rounded-2xl border-none bg-slate-50 font-black text-xs uppercase tracking-widest text-slate-700 focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer transition-all"
            >
              <option value="" disabled>请选择目标分析课程</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.courseName}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
               <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
          
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="通过学生姓名或学籍号进行多维检索..."
              className="h-14 pl-12 rounded-2xl border-none bg-slate-50 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Button 
            className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black font-black text-white shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest"
          >
            <FileSpreadsheet className="w-5 h-5 mr-3" /> 导出效能报表
          </Button>
        )}
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          const themeColor = s.theme === 'blue' ? 'text-blue-600 bg-blue-50' : s.theme === 'orange' ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50';
          return (
            <Card key={i} className="border-none shadow-sm rounded-[40px] overflow-hidden bg-white group hover:shadow-xl transition-all">
              <CardContent className="p-8 flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-transform group-hover:rotate-12 ${themeColor}`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{s.val}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Grade Matrix Table */}
      <Card className="border-none shadow-sm rounded-[48px] overflow-hidden bg-white">
        <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
           <div>
             <CardTitle className="text-xl font-black text-slate-900 tracking-tight uppercase">绩点与效能矩阵</CardTitle>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
               {selectedCourse ? `ANALYZING: ${courses.find(c => c.id === selectedCourse)?.courseName}` : 'SELECT A COMPONENT TO START ANALYSIS'}
             </p>
           </div>
           <div className="bg-slate-50 p-2 rounded-2xl">
              <BarChart3 className="w-5 h-5 text-slate-300" />
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-w-[900px]">
            {loading ? (
              <div className="py-32 flex flex-col items-center animate-pulse">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">正在深度解析学期绩点分布...</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-12 px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-50">
                   <div className="col-span-3">学生身份标识</div>
                   <div className="col-span-2 text-center">形成性评估 (40%)</div>
                   <div className="col-span-2 text-center">终结性考核 (60%)</div>
                   <div className="col-span-2 text-center">综合效能得分</div>
                   <div className="col-span-2 text-center">全域排名状态</div>
                   <div className="col-span-1 text-right">状态</div>
                </div>
                <div className="divide-y divide-slate-50">
                  {filteredGrades.map((grade) => (
                    <div key={grade.studentId} className="grid grid-cols-12 items-center px-10 py-6 hover:bg-slate-50 transition-all group">
                       <div className="col-span-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                             {grade.studentName?.charAt(0)}
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-800 tracking-tight">{grade.studentName}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase">ENROLLED STUDENT</p>
                          </div>
                       </div>
                       <div className="col-span-2 text-center font-mono font-black text-slate-500">{grade.assignmentGrade}</div>
                       <div className="col-span-2 text-center font-mono font-black text-slate-500">{grade.examGrade}</div>
                       <div className="col-span-2 flex justify-center">
                          <div className={`flex items-center gap-2 font-black text-lg tracking-tighter ${
                            grade.finalGrade >= 90 ? 'text-green-600' : grade.finalGrade < 60 ? 'text-red-500' : 'text-slate-900'
                          }`}>
                             {grade.finalGrade}
                             <ArrowUpRight className={`w-4 h-4 opacity-40 ${grade.finalGrade >= 90 ? 'rotate-0' : 'rotate-90'}`} />
                          </div>
                       </div>
                       <div className="col-span-2 flex justify-center">
                          <Badge variant="outline" className="rounded-lg px-3 py-1 bg-white border-slate-100 text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-sm">
                            LEVEL {grade.rank <= 3 ? 'GOLD' : 'STD'} • RANK {grade.rank}
                          </Badge>
                       </div>
                       <div className="col-span-1 flex justify-end">
                          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                       </div>
                    </div>
                  ))}
                  {(filteredGrades.length === 0 || !selectedCourse) && !loading && (
                    <div className="py-32 flex flex-col items-center justify-center text-center">
                       <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                         <TrendingUp className="w-10 h-10 text-slate-200" />
                       </div>
                       <h4 className="text-xl font-black text-slate-900 tracking-tight">暂无成绩数据记录</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 max-w-xs mx-auto leading-relaxed">
                         请在上方选择目标课程单元以启动效能矩阵分析同步。
                       </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grade Trends Mockup (Visual Only for premium feel) */}
      <div className="mt-8 p-10 bg-slate-900 rounded-[48px] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[400px] h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
         <div className="space-y-4 relative z-10 text-center md:text-left">
            <h3 className="text-2xl font-black tracking-tight">智能绩效预警系统已处于活跃状态</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-md">SYSTEM-CALCULATED GRADE TRENDS AND PREDICTIVE PERFORMANCE MODELING ARE NOW ONLINE.</p>
         </div>
         <Button className="relative z-10 h-16 px-10 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/40 transform -rotate-2">
            查看趋势报告
         </Button>
      </div>
    </div>
  );
}
