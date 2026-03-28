import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Users, Award, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data for exam results
const mockExamResults = [
  { studentId: 'u1', name: '张三', score: 85 },
  { studentId: 'u2', name: '李四', score: 92 },
  { studentId: 'u5', name: '王五', score: 78 },
  { studentId: 'u6', name: '赵六', score: 65 },
  { studentId: 'u7', name: '钱七', score: 95 },
  { studentId: 'u8', name: '孙八', score: 55 },
  { studentId: 'u9', name: '周九', score: 88 },
  { studentId: 'u10', name: '吴十', score: 72 },
  { studentId: 'u11', name: '郑十一', score: 81 },
  { studentId: 'u12', name: '王十二', score: 45 },
  { studentId: 'u13', name: '李十三', score: 98 },
  { studentId: 'u14', name: '赵十四', score: 76 },
  { studentId: 'u15', name: '陈十五', score: 89 },
  { studentId: 'u16', name: '刘十六', score: 68 },
  { studentId: 'u17', name: '张十七', score: 91 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#ef4444'];

export default function ExamAnalysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Calculate statistics
  const stats = useMemo(() => {
    if (mockExamResults.length === 0) return null;

    const scores = mockExamResults.map((r) => r.score);
    const total = scores.reduce((sum, score) => sum + score, 0);
    const average = (total / scores.length).toFixed(1);
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passCount = scores.filter((s) => s >= 60).length;
    const passRate = ((passCount / scores.length) * 100).toFixed(1);

    // Distribution for Bar Chart
    const distribution = [
      { range: '90-100', count: scores.filter((s) => s >= 90).length },
      { range: '80-89', count: scores.filter((s) => s >= 80 && s < 90).length },
      { range: '70-79', count: scores.filter((s) => s >= 70 && s < 80).length },
      { range: '60-69', count: scores.filter((s) => s >= 60 && s < 70).length },
      { range: '<60', count: scores.filter((s) => s < 60).length },
    ];

    // Pass/Fail for Pie Chart
    const passFailData = [
      { name: '及格 (>=60)', value: passCount },
      { name: '不及格 (<60)', value: scores.length - passCount },
    ];

    return {
      average,
      highest,
      lowest,
      passRate,
      totalStudents: scores.length,
      distribution,
      passFailData,
    };
  }, []);

  if (!stats) {
    return <div className="p-8 text-center text-gray-500">暂无考试数据</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/exams')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回考试列表
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">考试结果分析</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">平均分</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.average}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">最高分</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.highest}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-full">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">最低分</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.lowest}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">及格率</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.passRate}%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>分数段分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.distribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="range" />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value: number) => [`${value} 人`, '人数']}
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pass/Fail Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>及格情况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.passFailData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.passFailData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} 人`, '人数']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
