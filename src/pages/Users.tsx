import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Pencil, Trash2, X, Check,
  GraduationCap, BookOpen, Shield, KeyRound, 
  MoreVertical, Filter, UserPlus, AlertCircle, ChevronRight
} from 'lucide-react';

interface UserRecord {
  id: string;
  username: string;
  realName: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt?: string;
}

const ROLE_MAP = {
  student: { label: '学生', color: 'text-blue-600', bg: 'bg-blue-50', icon: GraduationCap, theme: 'blue' },
  teacher: { label: '教师', color: 'text-green-600', bg: 'bg-green-50', icon: BookOpen, theme: 'green' },
  admin:   { label: '管理员', color: 'text-purple-600', bg: 'bg-purple-50', icon: Shield, theme: 'purple' },
};

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState({ username: '', realName: '', role: 'student' as const, password: '' });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = roleFilter === 'all' ? '/api/users' : `/api/users?role=${roleFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const filteredUsers = users.filter(u =>
    u.realName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => {
    setEditingUser(null);
    setFormData({ username: '', realName: '', role: 'student', password: '' });
    setShowModal(true);
  };

  const openEdit = (u: UserRecord) => {
    setEditingUser(u);
    setFormData({ username: u.username, realName: u.realName, role: u.role, password: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.username.trim() || !formData.realName.trim()) return;
    setSaving(true);
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        setFeedback(err.error || '操作失败');
        return;
      }
      setShowModal(false);
      setFeedback(editingUser ? '更新成功' : '用户已创建');
      fetchUsers();
    } catch {
      setFeedback('网络错误，请重试');
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要彻底移除该用户吗？此操作无法撤销。')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    setFeedback('用户档案已移除');
    fetchUsers();
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleResetPassword = async (u: UserRecord) => {
    if (!confirm(`将 ${u.realName} 的密码重置为与其用户名一致？`)) return;
    await fetch(`/api/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: u.username }),
    });
    setFeedback(`${u.realName} 的准考密码已重置完成`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const stats = [
    { label: '注册学生', count: users.filter(u => u.role === 'student').length, icon: GraduationCap, theme: 'blue' },
    { label: '执教教师', count: users.filter(u => u.role === 'teacher').length, icon: BookOpen, theme: 'green' },
    { label: '系统管理员', count: users.filter(u => u.role === 'admin').length, icon: Shield, theme: 'purple' },
  ];

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-300">
        <Shield className="w-20 h-20 mb-6 opacity-10" />
        <h3 className="text-xl font-black text-slate-900 tracking-tight">权限限制</h3>
        <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">ACCESS DENIED - ADMINISTRATIVE PRIVILEGES REQUIRED</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
             用户档案管理中心
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">IDENTITY & ACCESS MANAGEMENT SYSTEM</p>
        </div>
        <Button onClick={openAdd} className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black font-black text-white shadow-xl active:scale-95 transition-all">
          <UserPlus className="w-5 h-5 mr-3" /> 新增架构成员
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white hover:shadow-xl transition-all group">
              <CardContent className="p-8 flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-transform group-hover:scale-110 ${
                   s.theme === 'blue' ? 'bg-blue-50 text-blue-600' : 
                   s.theme === 'green' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'
                }`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tight">{s.count}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl shadow-blue-900/10 text-sm font-black"
          >
            <Check className="w-4 h-4 text-green-400" />
            <span>{feedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Control */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="搜索姓名、系统 ID 或特定用户..."
            className="pl-12 h-14 rounded-2xl border-none bg-white shadow-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm flex border border-white">
          {(['all', 'student', 'teacher', 'admin'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-6 h-11 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                roleFilter === r 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-white hover:text-slate-900'
              }`}
            >
              {r === 'all' ? '全部视角' : ROLE_MAP[r].label}
            </button>
          ))}
        </div>
      </div>

      {/* User Directory Table/Grid */}
      <Card className="border-none shadow-sm rounded-[40px] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
           <div>
             <CardTitle className="text-lg font-black text-slate-900 tracking-tight">架构成员目录</CardTitle>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">TOTAL DIRECTORY ENTRIES: {filteredUsers.length}</p>
           </div>
           <Button variant="ghost" size="icon" className="rounded-xl">
              <MoreVertical className="w-5 h-5 text-slate-300" />
           </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 animate-pulse">
               <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">同步全局档案中...</p>
            </div>
          ) : (
            <div className="min-w-[800px]">
               <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <div className="col-span-4">成员身份与姓名</div>
                  <div className="col-span-3">系统唯一识别码 (UID)</div>
                  <div className="col-span-2 text-center">职能角色</div>
                  <div className="col-span-3 text-right">档案运维操作</div>
               </div>
               <div className="divide-y divide-slate-50">
                 {filteredUsers.map(u => {
                   const roleInfo = ROLE_MAP[u.role];
                   const Icon = roleInfo.icon;
                   return (
                     <div key={u.id} className="grid grid-cols-12 items-center gap-4 px-8 py-5 hover:bg-slate-50 transition-colors group">
                        <div className="col-span-4 flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm transition-colors ${
                              u.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                              u.role === 'teacher' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                           }`}>
                              {u.realName.charAt(0)}
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-900 tracking-tight">{u.realName}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">ESTABLISHED MEMBER</p>
                           </div>
                        </div>
                        <div className="col-span-3">
                           <p className="text-xs font-black text-slate-500 font-mono tracking-tighter opacity-60">{u.username}</p>
                        </div>
                        <div className="col-span-2 flex justify-center">
                           <Badge variant="outline" className={`rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest border-none ${roleInfo.bg} ${roleInfo.color}`}>
                              <Icon className="w-3 h-3 mr-2" />
                              {roleInfo.label}
                           </Badge>
                        </div>
                        <div className="col-span-3 flex justify-end gap-2">
                           <Button variant="ghost" size="icon" onClick={() => handleResetPassword(u)} className="w-10 h-10 rounded-xl text-slate-300 hover:text-orange-500 hover:bg-white hover:shadow-xl transition-all">
                             <KeyRound className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => openEdit(u)} className="w-10 h-10 rounded-xl text-slate-300 hover:text-blue-600 hover:bg-white hover:shadow-xl transition-all">
                             <Pencil className="w-4 h-4" />
                           </Button>
                           {u.id !== currentUser?.id && (
                             <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)} className="w-10 h-10 rounded-xl text-slate-300 hover:text-red-600 hover:bg-white hover:shadow-xl transition-all">
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           )}
                           <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-slate-300">
                              <ChevronRight className="w-4 h-4" />
                           </Button>
                        </div>
                     </div>
                   );
                 })}
                 {filteredUsers.length === 0 && (
                   <div className="py-20 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Users className="w-8 h-8 text-slate-200" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900">未检索到匹配档案</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">NO MATCHING DIRECTORY RECORDS FOUND</p>
                   </div>
                 )}
               </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowModal(false)} />
            <motion.div
              className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden z-10"
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
            >
              <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {editingUser ? '档案记录修缮' : '新建成员索引'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">IDENTITY CONFIGURATION MANAGER</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:scale-110">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">真实姓名 (IDENTITY)</label>
                      <Input
                        value={formData.realName}
                        onChange={e => setFormData(p => ({ ...p, realName: e.target.value }))}
                        placeholder="请输入法核姓名"
                        className="h-14 rounded-2xl border-none bg-slate-50 font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">登录 ID (UID)</label>
                      <Input
                        value={formData.username}
                        onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                        placeholder="请输入唯一识别码"
                        disabled={!!editingUser}
                        className="h-14 rounded-2xl border-none bg-slate-50 font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-40"
                      />
                   </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">分配职能权限 (SECURITY ROLE)</label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['student', 'teacher', 'admin'] as const).map(r => {
                      const info = ROLE_MAP[r];
                      const Icon = info.icon;
                      const isActive = formData.role === r;
                      return (
                        <button
                          key={r}
                          onClick={() => setFormData(p => ({ ...p, role: r }))}
                          className={`flex flex-col items-center justify-center p-6 rounded-[28px] border-2 transition-all gap-3 ${
                            isActive 
                              ? `border-${info.theme}-500 bg-${info.theme}-50 shadow-xl shadow-${info.theme}-900/5` 
                              : 'border-slate-50 bg-slate-50/30 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                              isActive ? `bg-white ${info.color}` : 'bg-white text-slate-300'
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? info.color : 'text-slate-400'}`}>
                            {info.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!editingUser && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">首效鉴权密码 (PASSPHRASE)</label>
                    <Input
                      value={formData.password}
                      onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                      placeholder="留空即默认采用用户登录 ID"
                      type="password"
                      className="h-14 rounded-2xl border-none bg-slate-50 font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                   <Button variant="outline" className="h-16 flex-1 rounded-2xl border-slate-100 font-black tracking-widest uppercase text-xs" onClick={() => setShowModal(false)}>
                      取消操作
                   </Button>
                   <Button
                      className="h-16 flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black tracking-widest uppercase text-xs shadow-2xl shadow-blue-900/40 active:scale-95 transition-all text-white"
                      onClick={handleSave}
                      disabled={saving || !formData.username || !formData.realName}
                   >
                     {saving ? (
                       <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       editingUser ? '确认修缮档案' : '确认录入索引'
                     )}
                   </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
