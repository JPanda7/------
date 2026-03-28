import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Button } from './ui/button';
import {
  LayoutDashboard, BookOpen, FileText, Calendar,
  Users, Bell, LogOut, ClipboardList, Menu, X, FolderOpen, 
  GraduationCap, CheckSquare, Search, Command, ChevronRight,
  ShieldCheck, UserCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { notifications } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!user) {
    return <Outlet />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: '仪表盘', icon: LayoutDashboard, roles: ['student', 'teacher', 'admin'] },
    { path: '/courses', label: '课程全览', icon: BookOpen, roles: ['student', 'teacher', 'admin'] },
    { path: '/materials', label: '教研资料', icon: FolderOpen, roles: ['student', 'teacher', 'admin'] },
    { path: '/assignments', label: '任务管线', icon: CheckSquare, roles: ['student', 'teacher', 'admin'] },
    { path: '/exams', label: '考试评估', icon: FileText, roles: ['student', 'teacher', 'admin'] },
    { path: '/attendance', label: '终端考勤', icon: Calendar, roles: ['student', 'teacher', 'admin'] },
    { path: '/grades', label: '效能分析', icon: GraduationCap, roles: ['student', 'teacher', 'admin'] },
    { path: '/messages', label: '通讯中心', icon: Bell, roles: ['student', 'teacher', 'admin'], badge: unreadCount },
    { path: '/users', label: '内核管理', icon: Users, roles: ['admin'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(user.role));
  const currentPageTitle = visibleNavItems.find(item => 
    location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
  )?.label || '控制台';

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 flex selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar - Desktop */}
      <aside className="w-[300px] h-screen bg-slate-900 sticky top-0 left-0 flex flex-col shadow-2xl z-50 overflow-hidden">
        {/* Decorative background for sidebar */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Brand Section */}
        <div className="h-24 flex items-center px-10 relative">
          <div className="w-10 h-10 bg-blue-600 rounded-[14px] flex items-center justify-center mr-4 shadow-xl shadow-blue-900/40 transform rotate-3 relative group">
             <BookOpen className="w-6 h-6 text-white" />
             <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity rounded-[14px]" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-white uppercase italic">Edu<span className="text-blue-500">Flux</span></span>
            <span className="text-[9px] font-black tracking-[0.3em] text-slate-500 uppercase opacity-60">System Core v3.0</span>
          </div>
        </div>
        
        {/* User Identity Section */}
        <div className="px-8 mb-6">
           <div className="bg-white/5 border border-white/5 rounded-[32px] p-5 flex items-center gap-4 group hover:bg-white/10 transition-all cursor-pointer">
              <div className="relative">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-xl ring-2 ring-white/10">
                    {user.realName ? user.realName.charAt(0) : (user.username ? user.username.charAt(0) : '?')}
                 </div>
                 <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full shadow-lg"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{user.realName}</p>
                <div className="flex items-center gap-1.5 opacity-40 mt-0.5">
                   <ShieldCheck className="w-3 h-3 text-blue-400" />
                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{user.role}</p>
                </div>
              </div>
           </div>
        </div>

        {/* Global Navigation */}
        <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto custom-scrollbar-dark py-4">
           <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 opacity-50">Operational Mainframe</p>
           {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-5 py-4 text-xs font-black uppercase tracking-widest rounded-[22px] transition-all duration-300 group relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/20 translate-x-2'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 mr-4 transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:scale-110 group-hover:text-blue-400'}`} />
                  {item.badge && item.badge > 0 && (
                    <span className={`absolute -top-2.5 -right-2 min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center text-[9px] font-black shadow-lg ${
                      isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white animate-bounce'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeSideIndicator"
                    className="absolute right-0 w-1.5 h-6 bg-white rounded-l-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {!isActive && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity ml-auto text-slate-500" />}
              </Link>
            );
          })}
        </nav>

        {/* System Footer Control */}
        <div className="p-8 mt-auto border-t border-white/5 bg-black/20">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-300 px-5 py-4 h-auto group" 
            onClick={handleLogout}
          >
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mr-4 group-hover:bg-red-500/20 transition-colors">
              <LogOut className="w-4 h-4 group-hover:text-red-500" />
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest">终端登出</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F8FAFC]">
        {/* Dynamic Translucent Header */}
        <header className={`h-24 sticky top-0 flex items-center px-12 justify-between z-40 transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/50' : 'bg-transparent'
        }`}>
          <div className="flex flex-col">
             <motion.h1 
               key={currentPageTitle}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className="text-3xl font-black text-slate-900 tracking-tighter"
             >
                {currentPageTitle}
             </motion.h1>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic">EduFlux Framework Environment</p>
          </div>

          <div className="flex items-center gap-8">
             <div className="hidden lg:flex items-center gap-3 bg-slate-100 rounded-2xl px-5 py-3 border border-slate-200/50 shadow-inner group">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">全局检索系统</span>
                <div className="flex gap-1 ml-4 opacity-30">
                   <Command className="w-3 h-3" />
                   <span className="text-[10px] font-black uppercase">K</span>
                </div>
             </div>

             <div className="h-10 w-[1px] bg-slate-200 mx-2" />

             <div className="flex items-center gap-4">
                <div className="text-right flex flex-col items-end">
                   <span className="text-xs font-black text-slate-900 tracking-tight">{format(new Date(), 'EEEE', { locale: zhCN })}</span>
                   <span className="text-[10px] font-bold text-slate-400">{format(new Date(), 'yyyy / MM / dd')}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center text-slate-400 group cursor-pointer hover:bg-blue-600 hover:text-white transition-all">
                   <UserCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </div>
             </div>
          </div>
        </header>

        {/* Viewport Render Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-light p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.19, 1.0, 0.22, 1.0] }}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global CSS for custom scrollbars & fonts (to be in actual CSS if possible, but keeping here for scope) */}
      <style>{`
        .custom-scrollbar-dark::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar-dark::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        
        .custom-scrollbar-light::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
      `}</style>
    </div>
  );
}
