import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, LogIn, Shield, GraduationCap, ArrowRight, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username) {
      setError('请输入用户名');
      return;
    }

    setIsLoading(true);
    setError('');
    
    const success = await login(username);
    if (success) {
      navigate('/');
    } else {
      setError('登录失败：用户不存在');
      setIsLoading(false);
    }
  };

  const quickFill = (name: string) => {
    setUsername(name);
    setError('');
  };

  const demoAccounts = [
    { role: 'admin', user: 'admin1', name: '管理员', color: 'bg-purple-50 hover:bg-purple-100 text-purple-600', icon: Shield },
    { role: 'teacher', user: 'teacher1', name: '王老师', color: 'bg-blue-50 hover:bg-blue-100 text-blue-600', icon: UserCheck },
    { role: 'student', user: 'student1', name: '张三同学', color: 'bg-green-50 hover:bg-green-100 text-green-600', icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#020617] overflow-hidden px-4">
      {/* Background Decor */}
      <div className="absolute top-0 -left-64 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
      <div className="absolute bottom-0 -right-64 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg z-10"
      >
        <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-2xl rounded-[40px] overflow-hidden">
          <CardHeader className="pt-12 pb-8 px-10 text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-200 mb-6">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">EduPlus 教学系统</CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-2">专业的数字化教学全流程管理平台</CardDescription>
          </CardHeader>
          
          <CardContent className="px-10 pb-12">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">用户名</label>
                <div className="relative group">
                  <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    placeholder="请输入测试账号或用户名"
                    className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-sm font-semibold"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-red-500 text-xs font-bold bg-red-50 py-2 px-4 rounded-xl border border-red-100"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button 
                className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl text-md font-bold shadow-xl transition-all active:scale-95 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-b-2 border-white rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center">
                    登录系统 <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-10">
              <div className="relative flex items-center justify-center mb-6">
                 <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                 <span className="relative bg-[#ffffff] px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">快速体验演示账号</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {demoAccounts.map((acc) => {
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.user}
                      onClick={() => quickFill(acc.user)}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all border border-transparent font-bold ${acc.color} group hover:translate-x-1`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-xl bg-white/60"><Icon className="w-4 h-4" /></div>
                        <span className="text-sm">{acc.name}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-60 group-hover:opacity-100">{acc.user}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

