import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from './ui/button';
import { BookOpen, CheckSquare, FileText, LayoutDashboard, LogOut, GraduationCap, Users } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) {
    return <Outlet />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: '仪表盘', icon: LayoutDashboard, roles: ['student', 'teacher', 'admin'] },
    { path: '/courses', label: '课程信息', icon: BookOpen, roles: ['student', 'teacher', 'admin'] },
    { path: '/assignments', label: '作业管理', icon: CheckSquare, roles: ['student', 'teacher', 'admin'] },
    { path: '/exams', label: '考试管理', icon: FileText, roles: ['student', 'teacher', 'admin'] },
    { path: '/grades', label: '成绩管理', icon: GraduationCap, roles: ['student', 'teacher', 'admin'] },
    { path: '/users', label: '用户管理', icon: Users, roles: ['admin'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
          <span className="font-bold text-lg text-gray-900">教学管理系统</span>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {user.realName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user.realName}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-3" />
            退出登录
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between shrink-0">
          <h1 className="text-xl font-semibold text-gray-800">
            {visibleNavItems.find(item => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)))?.label || '教学管理系统'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">{new Date().toLocaleDateString('zh-CN')}</span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
