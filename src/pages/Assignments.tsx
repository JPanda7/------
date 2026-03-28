import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useCourseStore } from '@/store/courseStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, FileUp, Eye, Edit3, CheckCircle, 
  Calendar, Clock, ChevronRight, FileText, AlertCircle, 
  Filter, MoreVertical, LayoutGrid, List
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export default function Assignments({ courseId }: { courseId?: string }) {
  const { user } = useAuthStore();
  const { assignments: allAssignments, fetchAssignments, submissions, loading } = useAssignmentStore();
  const { courses, fetchCourses } = useCourseStore();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const courseIdFromUrl = searchParams.get('courseId') || '';
  const [selectedCourse, setSelectedCourse] = useState(courseId || courseIdFromUrl);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (courseId) {
      setSelectedCourse(courseId);
    }
  }, [courseId]);

  useEffect(() => {
    if (selectedCourse) {
      fetchAssignments(selectedCourse);
      if (!courseId) {
        setSearchParams({ courseId: selectedCourse });
      }
    }
  }, [selectedCourse, fetchAssignments, setSearchParams, courseId]);

  const assignments = allAssignments.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusInfo = (assignment: any) => {
    const isPast = new Date(assignment.deadline) < new Date();
    if (user?.role !== 'student') {
      return isPast ? { label: '已截止', color: 'bg-slate-100 text-slate-500' } : { label: '进行中', color: 'bg-green-50 text-green-600 border-green-100' };
    }

    const mySubmissions = submissions.filter(s => s.assignmentId === assignment.id && s.studentId === user.id);
    const submitted = mySubmissions.filter(s => s.status !== 'draft').sort((a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime());
    const draft = mySubmissions.find(s => s.status === 'draft');

    if (submitted.length > 0) {
      const latest = submitted[0];
      if (latest.status === 'graded') return { label: `评分: ${latest.score}`, color: 'bg-blue-50 text-blue-600 border-blue-100' };
      if (latest.isLate) return { label: '迟交', color: 'bg-orange-50 text-orange-600 border-orange-100' };
      return { label: '已提交', color: 'bg-green-50 text-green-600 border-green-100' };
    }
    if (draft) return { label: '草稿', color: 'bg-slate-100 text-slate-500' };
    return isPast ? { label: '缺交', color: 'bg-red-50 text-red-600 border-red-100' } : { label: '待提交', color: 'bg-blue-50 text-blue-600 border-blue-100' };
  };

  return (
    <div className="space-y-8">
      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="搜索作业、课号或关键词..."
              className="pl-12 h-14 rounded-2xl border-none bg-white shadow-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!courseId && (
            <div className="relative group">
               <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="appearance-none h-14 w-[240px] pl-5 pr-10 rounded-2xl border-none bg-white shadow-sm text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
              >
                <option value="" disabled>选择课号筛选</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.courseCode} - {c.courseName}</option>
                ))}
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-white p-1 rounded-xl shadow-sm hidden sm:flex">
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('list')} 
                className="w-10 h-10 rounded-lg"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('grid')}
                className="w-10 h-10 rounded-lg"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
           </div>
           {(user?.role === 'teacher' || user?.role === 'admin') && (
            <Button 
              onClick={() => navigate(`/assignments/new?courseId=${selectedCourse}`)} 
              disabled={!selectedCourse}
              className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black font-black text-white shadow-xl active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5 mr-3" /> 发布新任务
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 rounded-[32px] bg-white animate-pulse" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {assignments.length > 0 ? (
            <motion.div 
              layout
              className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
                : "space-y-4"
              }
            >
              {assignments.map((assignment) => {
                const status = getStatusInfo(assignment);
                const isStudent = user?.role === 'student';
                const mySubmissions = submissions.filter(s => s.assignmentId === assignment.id && s.studentId === user?.id);
                const submitted = mySubmissions.filter(s => s.status !== 'draft');
                const isDraft = mySubmissions.some(s => s.status === 'draft');
                const isSubmitted = submitted.length > 0;

                return (
                  <motion.div
                    key={assignment.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group relative overflow-hidden transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-white rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1' 
                        : 'bg-white rounded-[24px] p-6 shadow-sm hover:shadow-xl flex items-center justify-between'
                    }`}
                  >
                    {/* Status Ribbon (Grid only) */}
                    {viewMode === 'grid' && (
                       <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest ${status.color}`}>
                          {status.label}
                       </div>
                    )}

                    <div className={viewMode === 'list' ? 'flex items-center gap-6 flex-1' : 'space-y-6'}>
                      <div className={`p-4 rounded-2xl bg-slate-50 flex items-center justify-center transition-colors group-hover:bg-blue-50`}>
                        <FileText className={`w-6 h-6 transition-colors group-hover:text-blue-600 ${viewMode === 'list' ? 'text-slate-400' : 'text-slate-600'}`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                           <h3 className="text-lg font-black text-slate-900 tracking-tight line-clamp-1">{assignment.title}</h3>
                           {viewMode === 'list' && (
                             <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${status.color}`}>
                                {status.label}
                             </Badge>
                           )}
                        </div>
                        <p className="text-sm font-medium text-slate-400 line-clamp-1 mb-4">{assignment.description || '无任务简介'}</p>
                        
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-2 text-slate-400">
                             <Calendar className="w-3.5 h-3.5" />
                             <span className="text-xs font-bold">{format(new Date(assignment.deadline), 'MM月dd日 HH:mm')}截止</span>
                           </div>
                           <div className="flex items-center gap-2 text-slate-400">
                             <Clock className="w-3.5 h-3.5" />
                             <span className="text-xs font-bold">{assignment.totalScore} 满分</span>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 ${viewMode === 'grid' ? 'mt-8 pt-6 border-t border-slate-50 justify-between' : ''}`}>
                       {isStudent ? (
                          <Button 
                            variant={isSubmitted ? "outline" : "default"}
                            className={`flex-1 h-12 rounded-2xl font-black text-sm active:scale-95 transition-all ${
                               isSubmitted ? 'border-slate-100 hover:bg-slate-50' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100'
                            }`}
                            onClick={() => navigate(`/assignments/${assignment.id}/submit`)}
                          >
                             {isSubmitted ? (
                                <><Eye className="w-4 h-4 mr-2" /> 详情记录</>
                             ) : isDraft ? (
                                <><Edit3 className="w-4 h-4 mr-2" /> 继续草稿</>
                             ) : (
                                <><FileUp className="w-4 h-4 mr-2" /> 立即提交</>
                             )}
                          </Button>
                       ) : (
                         <div className="flex gap-3 flex-1">
                           <Button 
                             variant="outline" 
                             className="flex-1 h-12 rounded-2xl border-slate-100 font-black text-sm hover:bg-slate-50"
                             onClick={() => navigate(`/assignments/${assignment.id}/edit`)}
                           >
                             <Edit3 className="w-4 h-4 mr-2 text-slate-400" /> 编辑
                           </Button>
                           <Button 
                             className="flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-black font-black text-sm shadow-xl"
                             onClick={() => navigate(`/assignments/${assignment.id}/grade`)}
                           >
                             <CheckCircle className="w-4 h-4 mr-2" /> 批改
                           </Button>
                         </div>
                       )}
                       {viewMode === 'list' && (
                         <Button variant="ghost" size="icon" className="rounded-xl ml-2">
                           <MoreVertical className="w-4 h-4 text-slate-300" />
                         </Button>
                       )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                 <AlertCircle className="w-10 h-10 text-slate-200" />
               </div>
               <h3 className="text-xl font-black text-slate-900 tracking-tight">暂无已发布的作业</h3>
               <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">
                 目前该课程下没有任何作业任务。如果您是教师，请点击右上角按钮发布新的作业计划。
               </p>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
