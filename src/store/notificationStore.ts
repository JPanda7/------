import { create } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  content: string; // 修正命名一致性 (Messages.tsx 使用了 content)
  timestamp: string; // 修正命名一致性 (Messages.tsx 使用了 timestamp)
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
  targetRole?: 'student' | 'teacher' | 'admin';
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: 'n1',
      title: '课程提醒：Python财管大数据',
      content: '今日下午 2:00 在 3A-102 教室有实验课，请带好笔记本电脑。',
      timestamp: '2026-03-27T08:30:00Z',
      read: false,
      type: 'info',
      targetRole: 'student',
    },
    {
      id: 'n2',
      title: '作业截止提醒',
      content: '《第一章：环境搭建》作业将于明日 23:59 截止提交，请及时上传。',
      timestamp: '2026-03-26T15:00:00Z',
      read: true,
      type: 'warning',
      targetRole: 'student',
    },
    {
      id: 'n3',
      title: '成绩发布：期中测验',
      content: '期中随机小测验成绩已发布，请登录系统查看详情。',
      timestamp: '2026-03-25T10:00:00Z',
      read: false,
      type: 'success',
      targetRole: 'student',
    },
    {
      id: 'n4',
      title: '批改提醒',
      content: '您有 35 份《实验报告一》待批改，请在周五前完成。',
      timestamp: '2026-03-27T09:00:00Z',
      read: false,
      type: 'warning',
      targetRole: 'teacher',
    }
  ],
  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        ...notification,
        id: `n${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...state.notifications
    ]
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  clearAll: () => set({ notifications: [] }),
}));
