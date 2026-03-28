import { create } from 'zustand';
import { Course } from './mockData';

interface CourseState {
  courses: Course[];
  fetchCourses: () => Promise<void>;
  createCourse: (course: Omit<Course, 'id'>) => Promise<void>;
  updateCourse: (id: string, course: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  fetchCourses: async () => {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        set({ courses: data });
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  },
  createCourse: async (courseData) => {
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      });
      if (res.ok) {
        const data = await res.json();
        set((state) => ({ courses: [...state.courses, data] }));
      }
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  },
  updateCourse: (id, courseData) => set((state) => ({
    courses: state.courses.map((course) => 
      course.id === id ? { ...course, ...courseData } : course
    )
  })),
  deleteCourse: (id) => set((state) => ({
    courses: state.courses.filter((course) => course.id !== id)
  })),
}));
