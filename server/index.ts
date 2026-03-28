import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.ts';
import courseRoutes from './routes/courses.ts';
import assignmentRoutes from './routes/assignments.ts';
import examRoutes from './routes/exams.ts';
import userRoutes from './routes/users.ts';
import materialRoutes from './routes/materials.ts';
import attendanceRoutes from './routes/attendance.ts';
import debugRoutes from './routes/debug.ts';

dotenv.config({ path: '.env.server' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes (Compatible with both local /api and EdgeOne stripped paths)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/courses', '/courses'], courseRoutes);
app.use(['/api/assignments', '/assignments'], assignmentRoutes);
app.use(['/api/exams', '/exams'], examRoutes);
app.use(['/api/users', '/users'], userRoutes);
app.use(['/api/materials', '/materials'], materialRoutes);
app.use(['/api/attendance', '/attendance'], attendanceRoutes);
app.use(['/api/debug', '/debug'], debugRoutes);


// Health check
// Health check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Export the app for serverless platforms like EdgeOne
export default app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
  });
}
