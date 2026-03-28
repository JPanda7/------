import { create } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  targetRole?: 'student' | 'teacher' | 'admin';
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  markAsRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: 'n1',
      title: '关于《Python财管大数据》期中考试安排的通知',
      message: '各位同学，本学期期中考试将于下周开始，请大家做好复习准备...',
      date: '2026-03-15T10:00:00Z',
      read: false,
    }
  ],
  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        ...notification,
        id: `n${Date.now()}`,
        date: new Date().toISOString(),
        read: false,
      },
      ...state.notifications
    ]
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  }))
}));
