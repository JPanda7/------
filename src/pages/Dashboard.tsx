import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useCourseStore } from '@/store/courseStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CheckSquare, FileText, GraduationCap, Users } from 'lucide-react';
import { mockAssignments, mockSubmissions } from '@/store/mockData';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { notifications } = useNotificationStore();
  const { courses, fetchCourses } = useCourseStore();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const userNotifications = notifications.filter(n => !n.targetRole || n.targetRole === user?.role);

  const getStudentStats = () => {
    const myCourses = courses.length; // 真实 API 数据
    const myAssignments = mockAssignments.length;
    const mySubmissions = mockSubmissions.filter(s => s.studentId === user?.id).length;
    const pendingAssignments = myAssignments - mySubmissions;

    return [
      { title: '我的课程', value: myCourses, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
      { title: '待交作业', value: pendingAssignments, icon: CheckSquare, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      { title: '已交作业', value: mySubmissions, icon: FileText, color: 'text-green-600', bg: 'bg-green-100' },
      { title: '我的成绩', value: '85', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];
  };

  const getTeacherStats = () => {
    const myCourses = courses.filter(c => c.teacherId === user?.id).length;
    const activeAssignments = mockAssignments.length;
    const pendingGrades = mockSubmissions.filter(s => s.status === 'submitted').length;

    return [
      { title: '教授课程', value: myCourses, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
      { title: '进行中作业', value: activeAssignments, icon: CheckSquare, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      { title: '待批改作业', value: pendingGrades, icon: FileText, color: 'text-red-600', bg: 'bg-red-100' },
      { title: '学生总数', value: 120, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];
  };

  const getAdminStats = () => {
    return [
      { title: '总课程数', value: courses.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
      { title: '总用户数', value: 450, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
      { title: '活跃作业', value: mockAssignments.length, icon: CheckSquare, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      { title: '系统状态', value: '正常', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];
  };

  const stats = user?.role === 'student' ? getStudentStats() : user?.role === 'teacher' ? getTeacherStats() : getAdminStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6 flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>最近通知</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userNotifications.map((notification) => (
                <div key={notification.id} className="flex items-start space-x-4 p-4 rounded-lg border border-gray-100 bg-gray-50">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-600" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{format(new Date(notification.date), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))}
              {userNotifications.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">暂无通知</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>待办事项</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user?.role === 'student' ? (
                <>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-yellow-100 bg-yellow-50">
                    <div className="flex items-center space-x-3">
                      <CheckSquare className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-900">提交《Python财管大数据》第一章作业</span>
                    </div>
                    <span className="text-xs text-yellow-600 font-medium">截止: 明天 23:59</span>
                  </div>
                </>
              ) : user?.role === 'teacher' ? (
                <>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-red-100 bg-red-50">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-red-900">批改《Python财管大数据》实验报告</span>
                    </div>
                    <span className="text-xs text-red-600 font-medium">35份待批改</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-blue-100 bg-blue-50">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">审核新注册教师账号</span>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">5个待审核</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
