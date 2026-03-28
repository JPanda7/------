import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { useMaterialStore, Material } from '@/store/materialStore';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, FileText, Video, Download, Plus, Search, 
  Trash2, X, CloudUpload, Link as LinkIcon, FileCode, CheckSquare,
  ChevronRight, MoreVertical, LayoutGrid, List, File
} from 'lucide-react';

import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';
import { motion, AnimatePresence } from 'framer-motion';

export default function Materials({ courseId }: { courseId?: string }) {
  const { user } = useAuthStore();
  const { materials, loading, fetchMaterials, addMaterial, deleteMaterial } = useMaterialStore();
  const [category, setCategory] = useState<'all' | 'slides' | 'video' | 'reference' | 'homework'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ name: '', category: 'slides' as any, url: '' });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchMaterials(courseId);
  }, [fetchMaterials, courseId]);

  const filteredMaterials = materials.filter(m => 
    (category === 'all' || m.category === category) &&
    (!courseId || m.courseId === courseId) &&
    (m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categories = [
    { id: 'all', label: '全量资源', icon: FolderOpen, theme: 'bg-slate-900 text-white' },
    { id: 'slides', label: '精选课件', icon: FileText, theme: 'bg-blue-50 text-blue-600' },
    { id: 'video', label: '教学视频', icon: Video, theme: 'bg-orange-50 text-orange-600' },
    { id: 'reference', label: '参考文献', icon: FileCode, theme: 'bg-indigo-50 text-indigo-600' },
    { id: 'homework', label: '作业附件', icon: CheckSquare, theme: 'bg-green-50 text-green-600' },
  ];

  const handleUpload = async () => {
    if (!uploadData.name || !uploadData.url) return;
    await addMaterial({
      ...uploadData,
      courseId: courseId || 'c1',
      type: uploadData.url.endsWith('.mp4') ? 'video' : 'doc',
      size: `${(Math.random() * 10 + 1).toFixed(1)} MB`,
      uploaderId: user?.id
    });
    setShowUploadModal(false);
    setUploadData({ name: '', category: 'slides', url: '' });
  };

  const getFileIcon = (type: string) => {
    if (type === 'video') return <Video className="w-6 h-6 text-orange-500" />;
    return <FileText className="w-6 h-6 text-blue-500" />;
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">云端教研库</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">RESEARCH & LEARNING ASSETS CLOUD</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-50">
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('grid')}
                className="w-12 h-12 rounded-xl"
              >
                <LayoutGrid className="w-5 h-5" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('list')} 
                className="w-12 h-12 rounded-xl"
              >
                <List className="w-5 h-5" />
              </Button>
           </div>
           {isTeacher && (
            <Button 
              onClick={() => setShowUploadModal(true)}
              className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black font-black text-white shadow-xl active:scale-95 transition-all"
            >
              <CloudUpload className="w-5 h-5 mr-3" /> 发布教研资源
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-72 space-y-2">
          <div className="px-5 mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">资源范畴筛选</p>
          </div>
          {categories.map((cat) => {
            const Icon = cat.icon || FolderOpen;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as any)}
                className={`w-full group flex items-center px-6 py-4 rounded-[24px] transition-all duration-300 ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-2xl scale-[1.02]' 
                    : 'text-slate-600 hover:bg-white hover:shadow-xl'
                }`}
              >
                <div className={`p-2 rounded-xl mr-4 transition-colors ${
                   isActive ? 'bg-white/10 text-blue-400' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'
                }`}>
                   <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-500'}`}>
                   {cat.label}
                </span>
                {isActive && <motion.div layoutId="activeCat" className="ml-auto"><ChevronRight className="w-4 h-4 text-blue-400" /></motion.div>}
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white/50 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="搜索文档、视频、或者研究报告关键词..." 
                  className="pl-16 border-none bg-transparent h-14 text-sm font-bold text-slate-800 focus-visible:ring-0"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <AnimatePresence mode="wait">
            {loading ? (
              <div className="py-32 flex flex-col items-center animate-pulse">
                <div className="w-16 h-16 bg-slate-100 rounded-full mb-6" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">检索全量云端资源项目...</p>
              </div>
            ) : (
              <motion.div 
                layout
                className={viewMode === 'grid' 
                   ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" 
                   : "space-y-4"
                }
              >
                {filteredMaterials.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.id}
                    className={`group relative overflow-hidden bg-white transition-all duration-300 ${
                       viewMode === 'grid' 
                          ? 'rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2' 
                          : 'rounded-[24px] p-6 shadow-sm hover:shadow-xl flex items-center justify-between'
                    }`}
                  >
                    <div className={viewMode === 'list' ? 'flex items-center gap-6 flex-1' : 'space-y-6'}>
                      <div className={`p-6 rounded-[28px] transition-all group-hover:scale-110 shrink-0 ${
                        item.type === 'video' ? 'bg-orange-50' : 'bg-blue-50'
                      }`}>
                        {getFileIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-slate-900 truncate tracking-tight transition-colors group-hover:text-blue-600">
                          {item.name}
                        </h3>
                        <div className="flex flex-wrap items-center mt-2 gap-3">
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-50 text-slate-400 border-none">
                            {categories.find(c => c.id === item.category)?.label || 'GENERIC'}
                          </Badge>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                             <File className="w-3 h-3" /> {item.size || '3.2 MB'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'mt-8 pt-6 border-t border-slate-50' : 'ml-6'}`}>
                      <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl text-slate-300 hover:text-blue-600 hover:bg-white hover:shadow-xl transition-all">
                        <Download className="w-6 h-6" />
                      </Button>
                      {isTeacher && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteMaterial(item.id)}
                          className="w-12 h-12 rounded-2xl text-slate-300 hover:text-red-600 hover:bg-white hover:shadow-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                      {viewMode === 'grid' && (
                        <div className="ml-auto text-[10px] font-black text-slate-300 uppercase tracking-widest">
                           {format(new Date(item.uploadDate), 'yyyy.MM.dd')}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {filteredMaterials.length === 0 && !loading && (
            <div className="text-center py-32 bg-white rounded-[48px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
              <FolderOpen className="w-20 h-20 mx-auto mb-6 text-slate-100" />
              <h4 className="text-xl font-black text-slate-900 tracking-tight">查无此项教学资源</h4>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">NO MATCHING ASSETS IN CLOUD DIRECTORY</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
            >
              <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">发布全局研习资源</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">ASSET INGESTION PIPELINE</p>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:scale-110">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-10 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">资源显示名称 (ASSET LABEL)</label>
                  <Input 
                    placeholder="例：2026年度 财务建模实战讲义" 
                    className="h-16 rounded-2xl border-none bg-slate-50 font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                    value={uploadData.name}
                    onChange={e => setUploadData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">资源类目系统 (CATEGORY)</label>
                    <select 
                      className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none cursor-pointer"
                      value={uploadData.category}
                      onChange={e => setUploadData(p => ({ ...p, category: e.target.value as any }))}
                    >
                      {categories.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">文件交互类型 (INTERFACE)</label>
                    <div className="flex gap-2">
                      <Button 
                        variant={!uploadData.url.endsWith('.mp4') ? 'default' : 'outline'}
                        className="flex-1 rounded-2xl h-16 font-black uppercase text-[10px] tracking-widest"
                        onClick={() => setUploadData(p => ({ ...p, url: p.url.replace('.mp4', '.pdf') }))}
                      >
                         DOCX/PDF
                      </Button>
                      <Button 
                        variant={uploadData.url.endsWith('.mp4') ? 'default' : 'outline'}
                        className="flex-1 rounded-2xl h-16 font-black uppercase text-[10px] tracking-widest"
                        onClick={() => setUploadData(p => ({ ...p, url: p.url.replace('.pdf', '') + '.mp4' }))}
                      >
                         VIDEO
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center justify-between">
                    <span>云端映射地址 (SOURCE URL)</span>
                    <LinkIcon className="w-3 h-3 text-blue-500" />
                  </label>
                  <Input 
                    placeholder="https://cloud.storage.com/asset-id" 
                    className="h-16 rounded-2xl border-none bg-slate-50 font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-mono text-xs"
                    value={uploadData.url}
                    onChange={e => setUploadData(p => ({ ...p, url: e.target.value }))}
                  />
                </div>

                <div className="pt-4 flex gap-4">
                   <Button variant="outline" className="h-16 flex-1 rounded-2xl border-slate-100 font-black tracking-widest uppercase text-xs" onClick={() => setShowUploadModal(false)}>
                      放弃
                   </Button>
                   <Button 
                    className="h-16 flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black tracking-widest uppercase text-xs shadow-2xl shadow-blue-900/40 active:scale-95 transition-all text-white"
                    onClick={handleUpload}
                    disabled={!uploadData.name || !uploadData.url}
                  >
                    同步至云端
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
