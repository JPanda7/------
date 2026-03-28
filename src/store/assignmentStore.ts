import { create } from 'zustand';
import { mockAssignments, mockSubmissions, Submission, Assignment, Question } from './mockData';
export type { Submission, Assignment, Question };

interface AssignmentState {
  assignments: Assignment[];
  submissions: Submission[];
  loading: boolean;
  error: string | null;
  fetchAssignments: (courseId: string) => Promise<void>;
  fetchAssignmentById: (id: string) => Promise<Assignment | null>;
  fetchSubmissions: (assignmentId?: string, studentId?: string) => Promise<void>;
  addAssignment: (assignment: Omit<Assignment, 'id' | 'status'>) => Promise<void>;
  updateAssignment: (id: string, assignment: Partial<Assignment>) => Promise<void>;
  saveDraft: (submission: Partial<Submission> & { assignmentId: string, studentId: string }) => Promise<void>;
  submitAssignment: (submission: Partial<Submission> & { assignmentId: string, studentId: string }) => Promise<void>;
  gradeSubmission: (submissionId: string, manualScore: number, feedback: string, totalScore: number) => Promise<void>;
  batchGradeSubmissions: (grades: { id: string, manualScore: number, feedback: string, score: number }[]) => Promise<void>;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  submissions: [],
  loading: false,
  error: null,

  fetchAssignments: async (courseId) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/assignments/course/${courseId}`);
      const data = await response.json();
      set({ assignments: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchAssignmentById: async (id) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/assignments/${id}`);
      if (!response.ok) throw new Error('作业不存在');
      const data = await response.json();
      set((state) => ({
        assignments: state.assignments.some(a => a.id === id) 
          ? state.assignments.map(a => a.id === id ? data : a)
          : [...state.assignments, data],
        loading: false
      }));
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  fetchSubmissions: async (assignmentId, studentId) => {
    set({ loading: true });
    try {
      let url = '/api/assignments/submissions';
      const params = new URLSearchParams();
      if (assignmentId) params.append('assignmentId', assignmentId);
      if (studentId) params.append('studentId', studentId);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();
      set({ submissions: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  addAssignment: async (assignmentData) => {
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData),
      });
      const newAssignment = await response.json();
      set((state) => ({ assignments: [...state.assignments, newAssignment] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateAssignment: async (id, updatedFields) => {
    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      const updated = await response.json();
      set((state) => ({
        assignments: state.assignments.map(a => a.id === id ? { ...a, ...updated } : a)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  saveDraft: async (draft) => {
    await get().submitAssignment({ ...draft, status: 'draft' });
  },

  submitAssignment: async (submission) => {
    try {
      const response = await fetch('/api/assignments/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      const newSub = await response.json();
      set((state) => {
        const idx = state.submissions.findIndex(s => s.assignmentId === submission.assignmentId && s.studentId === submission.studentId);
        if (idx >= 0) {
          const newState = [...state.submissions];
          newState[idx] = newSub;
          return { submissions: newState };
        }
        return { submissions: [...state.submissions, newSub] };
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  gradeSubmission: async (submissionId, manualScore, feedback, totalScore) => {
    try {
      const response = await fetch(`/api/assignments/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualScore, feedback, score: totalScore }),
      });
      const updated = await response.json();
      set((state) => ({
        submissions: state.submissions.map(s => s.id === submissionId ? { ...s, ...updated } : s)
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  batchGradeSubmissions: async (grades) => {
    for (const g of grades) {
      await get().gradeSubmission(g.id, g.manualScore, g.feedback, g.score);
    }
  }
}));
