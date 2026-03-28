import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/store/notificationStore';
import { 
  Bell, Info, AlertCircle, CheckCircle2, Trash2, 
  Search, Filter, ChevronRight, MailOpen, Inbox
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';
import { motion, AnimatePresence } from 'framer-motion';

export default function Messages() {
  const { notifications, markAsRead, clearAll } = useNotificationStore();
  const [filter, setFilter] = useState<'all' | 'unread' | 'system'>('all');

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><Info className="w-5 h-5" /></div>;
      case 'warning': return <div className="p-3 rounded-2xl bg-orange-50 text-orange-600"><AlertCircle className="w-5 h-5" /></div>;
      case 'success': return <div className="p-3 rounded-2xl bg-green-50 text-green-600"><CheckCircle2 className="w-5 h-5" /></div>;
      default: return <div className="p-3 rounded-2xl bg-slate-50 text-slate-400"><Bell className="w-5 h-5" /></div>;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'system') return n.type === 'warning';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">全局通讯中心</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 italic">REAL-TIME NOTIFICATION HUB</p>
        </div>
        <div className="flex items-center gap-4">
           <button 
            onClick={clearAll}
            className="flex items-center px-6 py-3 rounded-2xl bg-white border border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 hover:border-red-100 hover:shadow-xl transition-all group"
          >
            <Trash2 className="w-4 h-4 mr-3 group-hover:animate-bounce" /> 清空冗余条目
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-3">
        {(['all', 'unread', 'system'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              filter === f 
                ? 'bg-slate-900 text-white shadow-2xl scale-105' 
                : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-50 shadow-sm'
            }`}
          >
            {f === 'all' ? '全部记录' : f === 'unread' ? '未读条目' : '系统告警'}
          </button>
        ))}
      </div>

      {/* Message Feed */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-32 flex flex-col items-center justify-center text-center bg-white rounded-[48px] border-2 border-dashed border-slate-50"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Inbox className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">通讯终端机空闲中</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">NO ACTIVE TRANSMISSIONS IN THIS FEED</p>
            </motion.div>
          ) : (
            filteredNotifications.map((notif, idx) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card 
                  className={`group relative overflow-hidden transition-all duration-500 rounded-[32px] cursor-pointer hover:shadow-2xl hover:-translate-y-1 border-none ${
                    notif.read ? 'opacity-50 bg-white/50' : 'bg-white shadow-sm ring-1 ring-slate-100'
                  }`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <CardContent className="p-8 flex items-start gap-8 relative">
                    {/* Visual indicators */}
                    {!notif.read && (
                       <div className="absolute top-8 right-8 w-3 h-3 bg-blue-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.8)] animate-pulse" />
                    )}
                    
                    <div className="shrink-0 transition-transform group-hover:scale-110">
                       {getIcon(notif.type)}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <h3 className={`text-xl font-black tracking-tight ${notif.read ? 'text-slate-600' : 'text-slate-900 group-hover:text-blue-600'} transition-colors`}>
                            {notif.title}
                          </h3>
                          <div className="flex items-center gap-2">
                             <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest border-none px-2 py-0.5 ${
                               notif.type === 'warning' ? 'bg-orange-100 text-orange-600' : 
                               notif.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                             }`}>
                                {notif.type.toUpperCase()} SIGNAL
                             </Badge>
                             <span className="text-[9px] font-black text-slate-300 uppercase italic opacity-60">ID: {notif.id.slice(0,6)}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter whitespace-nowrap bg-slate-50 px-3 py-1 rounded-full">
                          {format(new Date(notif.timestamp), 'yyyy.MM.dd HH:mm', { locale: zhCN })}
                        </span>
                      </div>
                      <p className={`text-sm font-bold leading-relaxed max-w-3xl ${notif.read ? 'text-slate-400' : 'text-slate-600'}`}>
                        {notif.content}
                      </p>
                    </div>

                    <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl shadow-slate-900/10">
                          <ChevronRight className="w-6 h-6 text-white" />
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Analytics Insight Mockup */}
      <div className="mt-20 p-12 bg-gradient-to-br from-slate-900 to-black rounded-[48px] text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-6 text-center md:text-left">
               <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center">
                  <MailOpen className="w-10 h-10 text-blue-400" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-3xl font-black tracking-tight leading-none">情报分发效能</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] max-w-sm">INTELLIGENCE DISTRIBUTION PROTOCOL ACTIVE. 99.9% MESSAGE DELIVERY RATE ACHIEVED.</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 w-full md:w-auto">
               {[
                 { label: '读取率', val: '86%' },
                 { label: '实时通道', val: 'SECURE' }
               ].map(s => (
                 <div key={s.label} className="bg-white/5 border border-white/5 p-6 rounded-[32px] text-center backdrop-blur-sm">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="text-2xl font-black text-white">{s.val}</p>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
