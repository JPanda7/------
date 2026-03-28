import { create } from 'zustand';

export interface Material {
  id: string;
  courseId: string;
  name: string;
  type: 'doc' | 'video' | 'link';
  size?: string;
  url: string;
  uploadDate: string;
  category: 'slides' | 'video' | 'reference' | 'homework';
  uploaderName?: string;
}

interface MaterialState {
  materials: Material[];
  loading: boolean;
  fetchMaterials: (courseId?: string) => Promise<void>;
  addMaterial: (material: Omit<Material, 'id' | 'uploadDate'> & { uploaderId?: string }) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
}

export const useMaterialStore = create<MaterialState>((set) => ({
  materials: [],
  loading: false,

  fetchMaterials: async (courseId) => {
    set({ loading: true });
    try {
      const url = courseId ? `/api/materials?courseId=${courseId}` : '/api/materials';
      const res = await fetch(url);
      if (!res.ok) throw new Error('获取资料失败');
      const data = await res.json();
      set({ materials: Array.isArray(data) ? data : [], loading: false });
    } catch {
      // 回退：保留现有 Mock 数据（如果有的话）
      set({ loading: false });
    }
  },

  addMaterial: async (material) => {
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      });
      if (!res.ok) throw new Error('上传失败');
      const newMaterial = await res.json();
      set(state => ({ materials: [newMaterial, ...state.materials] }));
    } catch (err) {
      // 本地 Mock 写入（离线兼容）
      const mockMaterial: Material = {
        ...material,
        id: `m${Date.now()}`,
        uploadDate: new Date().toISOString(),
      };
      set(state => ({ materials: [mockMaterial, ...state.materials] }));
    }
  },

  deleteMaterial: async (id) => {
    await fetch(`/api/materials/${id}`, { method: 'DELETE' });
    set(state => ({ materials: state.materials.filter(m => m.id !== id) }));
  },
}));
