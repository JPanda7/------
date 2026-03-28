import { create } from 'zustand';
import { Exam, mockExams } from './mockData';

interface ExamState {
  exams: Exam[];
  loading: boolean;
  error: string | null;
  fetchExams: (courseId: string) => Promise<void>;
  fetchExamById: (id: string) => Promise<Exam | null>;
  createExam: (exam: Omit<Exam, 'id' | 'status'>) => Promise<void>;
  updateExam: (id: string, exam: Partial<Exam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
}

export const useExamStore = create<ExamState>((set) => ({
  exams: [],
  loading: false,
  error: null,

  fetchExams: async (courseId) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/exams/course/${courseId}`);
      const data = await response.json();
      set({ exams: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchExamById: async (id) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/exams/${id}`);
      if (!response.ok) throw new Error('Exam not found');
      const data = await response.json();
      set({ loading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  createExam: async (examData) => {
    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examData),
      });
      const newExam = await response.json();
      set((state) => ({ exams: [...state.exams, newExam] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateExam: async (id, examData) => {
    try {
      const response = await fetch(`/api/exams/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examData),
      });
      const updated = await response.json();
      set((state) => ({
        exams: state.exams.map((exam) => exam.id === id ? { ...exam, ...updated } : exam)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteExam: async (id) => {
    try {
      await fetch(`/api/exams/${id}`, { method: 'DELETE' });
      set((state) => ({
        exams: state.exams.filter((exam) => exam.id !== id)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
