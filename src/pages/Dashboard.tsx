import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useCourseStore } from '@/store/courseStore';
import { 
  BookOpen, CheckSquare, FileText, GraduationCap, Users, 
  TrendingUp, Activity, Bell, Clock, Zap, Plus, Award, ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { notifications } = useNotificationStore();
  const { courses, fetchCourses } = useCourseStore();
  const navigate = useNavigate();
  
  if (!user) {
    return <div className="flex items-center justify-center min-h-[400px]">载入用户信息中...</div>;
  }

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const userNotifications = notifications.filter(n => !n.targetRole || n.targetRole === user?.role).slice(0, 3);

  const performanceData = [
    { name: 'Mon', hours: 4, score: 85 },
    { name: 'Tue', hours: 6, score: 78 },
    { name: 'Wed', hours: 5, score: 92 },
    { name: 'Thu', hours: 8, score: 88 },
    { name: 'Fri', hours: 7, score: 80 },
    { name: 'Sat', hours: 3, score: 95 },
    { name: 'Sun', hours: 2, score: 90 },
  ];

  const stats = user.role === 'student' ? [
    { label: '我的课程', value: courses.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '待交作业', value: '3', icon: CheckSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: '平均学分', value: '3.8', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '本周学习', value: '26h', icon: Clock, color: 'text-green-600', bg: 'bg-green-50' },
  ] : [
    { label: '教授课程', value: courses.filter(c => c.teacherId === user.id).length || courses.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '待处理作业', value: '12', icon: FileText, color: 'text-red-600', bg: 'bg-red-50' },
    { label: '课程活跃度', value: '94%', icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '学生总数', value: '128', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const quickActions = user?.role === 'teacher' || user?.role === 'admin' ? [
    { label: '发布新作业', icon: Plus, path: '/assignments/new', color: 'bg-blue-600' },
    { label: '发起签到', icon: Clock, path: '/attendance', color: 'bg-green-600' },
    { label: '系统通知', icon: Bell, path: '/messages', color: 'bg-purple-600' },
  ] : [
    { label: '查看课程', icon: BookOpen, path: '/courses', color: 'bg-blue-600' },
    { label: '提交作业', icon: Plus, path: '/assignments', color: 'bg-indigo-600' },
    { label: '成绩查询', icon: Award, path: '/grades', color: 'bg-purple-600' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            你好, {user?.realName} 👋
          </h1>
          <p className="text-slate-500 mt-1 font-medium">欢迎回到管理系统，这是您今日的运行概览。</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => navigate('/messages')}>
              <Bell className="w-4 h-4 mr-2" /> 消息
           </Button>
           <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100">
              <Zap className="w-4 h-4 mr-2" /> 快速同步
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
          >
            <Card className="border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden bg-white group">
              <CardContent className="p-6 relative">
                <div className="flex justify-between items-start">
                  <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${stat.bg}`}>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                  <Badge variant="secondary" className="bg-green-50 text-green-600 border-none font-bold">
                    +12% <TrendingUp className="w-3 h-3 ml-1" />
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                  <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-[32px] overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black text-slate-900">学情增长追踪</CardTitle>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">关键绩效指标深度分析</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center text-[10px] font-bold text-slate-400"><div className="w-2 h-2 rounded-full bg-blue-500 mr-2" /> 学习时长</div>
              <div className="flex items-center text-[10px] font-bold text-slate-400"><div className="w-2 h-2 rounded-full bg-indigo-500 mr-2" /> 指标得分</div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', fontWeight: 'bold'}}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorHours)" />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-slate-900 rounded-[32px] overflow-hidden text-white relative">
            <CardHeader className="p-8 pb-4 relative z-10">
              <CardTitle className="text-xl font-black">便捷入口</CardTitle>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">基于角色的快捷操作</p>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-3 relative z-10">
              {quickActions.map((action, i) => (
                <Button 
                  key={i}
                  className="w-full justify-between h-14 rounded-2xl bg-white/10 hover:bg-white/20 border-white/5 transition-all font-bold group"
                  onClick={() => navigate(action.path)}
                >
                  <span className="flex items-center gap-3">
                    <action.icon className="w-5 h-5" />
                    {action.label}
                  </span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              ))}
            </CardContent>
            <div className="absolute -bottom-4 -right-4 bg-blue-600/20 rounded-full w-40 h-40 blur-3xl pointer-events-none"></div>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black text-slate-900">最新通知</CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              {userNotifications.map((n) => (
                <div key={n.id} className="flex gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                    <Bell className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{n.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{format(new Date(n.timestamp), 'MM-dd HH:mm')}</p>
                  </div>
                </div>
              ))}
              {userNotifications.length === 0 && (
                <p className="text-center py-8 text-slate-300 text-sm font-medium">暂无未读消息</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


// Helper components if needed
