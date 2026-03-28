import { create } from 'zustand';

export interface AttendanceRecord {
  id: string;
  courseId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  studentId: string;
}

export interface AttendanceSession {
  id: string;
  courseId: string;
  courseName: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'closed';
  presentCount: number;
  totalCount: number;
}

interface AttendanceState {
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  loading: boolean;
  fetchSessions: (courseId?: string) => Promise<void>;
  addSession: (session: { courseId: string; courseName: string; totalCount?: number }) => Promise<void>;
  closeSession: (id: string) => Promise<void>;
  submitAttendance: (sessionId: string, studentId: string) => Promise<{ success: boolean; message: string }>;
}

// Mock 回退数据
const MOCK_SESSIONS: AttendanceSession[] = [
  {
    id: 's1',
    courseId: 'c1',
    courseName: 'Python财管大数据',
    startTime: '2026-03-27T14:00:00Z',
    endTime: '2026-03-27T14:30:00Z',
    status: 'closed',
    presentCount: 42,
    totalCount: 45,
  },
  {
    id: 's2',
    courseId: 'c2',
    courseName: '财务管理原理',
    startTime: '2026-03-26T09:00:00Z',
    endTime: '2026-03-26T09:30:00Z',
    status: 'closed',
    presentCount: 38,
    totalCount: 40,
  }
];

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  sessions: MOCK_SESSIONS,
  records: [],
  loading: false,

  fetchSessions: async (courseId) => {
    set({ loading: true });
    try {
      const url = courseId
        ? `/api/attendance/sessions?courseId=${courseId}`
        : '/api/attendance/sessions';
      const res = await fetch(url);
      if (!res.ok) throw new Error('获取签到记录失败');
      const data = await res.json();
      set({ sessions: Array.isArray(data) && data.length ? data : MOCK_SESSIONS, loading: false });
    } catch {
      set({ sessions: MOCK_SESSIONS, loading: false });
    }
  },

  addSession: async ({ courseId, courseName, totalCount }) => {
    try {
      const res = await fetch('/api/attendance/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, totalCount: totalCount || 45 }),
      });
      if (!res.ok) throw new Error();
      const newSession: AttendanceSession = await res.json();
      set(state => ({ sessions: [newSession, ...state.sessions] }));
    } catch {
      // Mock 回退
      const newSession: AttendanceSession = {
        id: `s${Date.now()}`,
        courseId,
        courseName,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30 * 60000).toISOString(),
        status: 'active',
        presentCount: 0,
        totalCount: totalCount || 45,
      };
      set(state => ({ sessions: [newSession, ...state.sessions] }));
    }
  },

  closeSession: async (id) => {
    try {
      await fetch(`/api/attendance/sessions/${id}/close`, { method: 'PATCH' });
    } catch { /* 忽略网络错误 */ }
    set(state => ({
      sessions: state.sessions.map(s => s.id === id ? { ...s, status: 'closed' } : s)
    }));
  },

  submitAttendance: async (sessionId, studentId) => {
    try {
      const res = await fetch('/api/attendance/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, studentId }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.error || '签到失败' };
      // 更新本地 presentCount
      set(state => ({
        sessions: state.sessions.map(s =>
          s.id === sessionId ? { ...s, presentCount: s.presentCount + 1 } : s
        )
      }));
      return { success: true, message: '签到成功！' };
    } catch {
      // Mock 回退
      const session = get().sessions.find(s => s.id === sessionId);
      if (!session || session.status === 'closed') {
        return { success: false, message: '签到已结束' };
      }
      set(state => ({
        sessions: state.sessions.map(s =>
          s.id === sessionId ? { ...s, presentCount: s.presentCount + 1 } : s
        )
      }));
      return { success: true, message: '签到成功！' };
    }
  },
}));
