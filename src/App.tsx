/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CoursePublish from './pages/CoursePublish';
import CourseDetails from './pages/CourseDetails';
import Assignments from './pages/Assignments';
import AssignmentSubmit from './pages/AssignmentSubmit';
import AssignmentPublish from './pages/AssignmentPublish';
import AssignmentGrading from './pages/AssignmentGrading';
import Exams from './pages/Exams';
import ExamPublish from './pages/ExamPublish';
import ExamAnalysis from './pages/ExamAnalysis';
import Grades from './pages/Grades';
import Attendance from './pages/Attendance';
import Materials from './pages/Materials';
import Messages from './pages/Messages';
import Users from './pages/Users';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AnimatedRoutes() {
  return (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id" element={<CourseDetails />} />
          <Route path="courses/new" element={<CoursePublish />} />
          <Route path="courses/:id/edit" element={<CoursePublish />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="assignments/new" element={<AssignmentPublish />} />
          <Route path="assignments/:id/edit" element={<AssignmentPublish />} />
          <Route path="assignments/:id/submit" element={<AssignmentSubmit />} />
          <Route path="assignments/:id/grade" element={<AssignmentGrading />} />
          <Route path="exams" element={<Exams />} />
          <Route path="exams/new" element={<ExamPublish />} />
          <Route path="exams/:id/edit" element={<ExamPublish />} />
          <Route path="exams/:id/analysis" element={<ExamAnalysis />} />
          <Route path="grades" element={<Grades />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="materials" element={<Materials />} />
          <Route path="messages" element={<Messages />} />
          <Route path="users" element={<Users />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
