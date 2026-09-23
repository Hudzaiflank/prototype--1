import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { AuthLayout } from "../layouts/AuthLayout";
import { StudentLayout } from "../layouts/StudentLayout";
import { LoginPage } from "../pages/auth/LoginPage";
import { ChangePasswordPage } from "../pages/auth/ChangePasswordPage";
import { JoinRoomPage } from "../pages/student/JoinRoomPage";
import { RulesPage } from "../pages/student/RulesPage";
import { StudentRoomPage } from "../pages/student/StudentRoomPage";
import { RoomInputPage } from "../pages/student/RoomInputPage";
import { RoomWaitingPage } from "../pages/student/RoomWaitingPage";
import { RoomGamePage } from "../pages/student/RoomGamePage";
import { RoomResultPage } from "../pages/student/RoomResultPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";
import { SuperAdminLayout } from "../layouts/SuperAdminLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import { TeacherLayout } from "../layouts/TeacherLayout";
import { DashboardPage as SuperAdminDashboardPage } from "../pages/super-admin/DashboardPage";
import { DashboardPage as AdminDashboardPage } from "../pages/admin/DashboardPage";
import { DashboardPage as TeacherDashboardPage } from "../pages/teacher/DashboardPage";
import { RoomMonitorPage } from "../pages/teacher/RoomMonitorPage";
import { ClassListPage as TeacherClassListPage } from "../pages/teacher/ClassListPage";
import { ClassDetailPage as TeacherClassDetailPage } from "../pages/teacher/ClassDetailPage";
import { RoomConfigurePage } from "../pages/teacher/RoomConfigurePage";
import { RoomHistoryPage } from "../pages/teacher/RoomHistoryPage";
import { HistoryDetailPage } from "../pages/teacher/HistoryDetailPage";
import { SchoolListPage } from "../pages/super-admin/SchoolListPage";
import { ClassListPage } from "../pages/admin/ClassListPage";
import { TeacherListPage } from "../pages/admin/TeacherListPage";
import { TeacherFormPage } from "../pages/admin/TeacherFormPage";
import { TopicListPage } from "../pages/admin/TopicListPage";
import { ClassFormPage } from "../pages/admin/ClassFormPage";
import { ClassDetailPage as AdminClassDetailPage } from "../pages/admin/ClassDetailPage";
import { TeacherDetailPage as AdminTeacherDetailPage } from "../pages/admin/TeacherDetailPage";
import { SchoolDetailPage } from "../pages/super-admin/SchoolDetailPage";
import { SchoolFormPage } from "../pages/super-admin/SchoolFormPage";
import { RequestLogsPage } from "../pages/super-admin/RequestLogsPage";
import { StudentTrackingPage } from "../pages/admin/StudentTrackingPage";
import { getRoleHome } from "./roleHome";

function HomeRedirect() {
  const { user } = useAuthContext();
  return <Navigate to={getRoleHome(user?.role)} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<StudentLayout />}>
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/join" element={<JoinRoomPage />} />
          <Route path="/room/:roomCode" element={<StudentRoomPage />}>
            <Route path="input" element={<RoomInputPage />} />
            <Route path="waiting" element={<RoomWaitingPage />} />
            <Route path="game" element={<RoomGamePage />} />
            <Route path="result" element={<RoomResultPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute roles={["SUPER_ADMIN"]} />}>
            <Route element={<SuperAdminLayout />}>
              <Route path="/dashboard" element={<SuperAdminDashboardPage />} />
              <Route path="/schools" element={<SchoolListPage />} />
              <Route path="/schools/new" element={<SchoolFormPage />} />
              <Route path="/schools/:schoolId" element={<SchoolDetailPage />} />
              <Route path="/request-logs" element={<RequestLogsPage />} />
              <Route
                path="/students/tracking"
                element={<StudentTrackingPage />}
              />
            </Route>
          </Route>
          <Route element={<RoleRoute roles={["ADMIN"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/classes" element={<ClassListPage />} />
              <Route path="/admin/classes/new" element={<ClassFormPage />} />
              <Route
                path="/admin/classes/:classId"
                element={<AdminClassDetailPage />}
              />
              <Route path="/admin/teachers" element={<TeacherListPage />} />
              <Route path="/admin/teachers/new" element={<TeacherFormPage />} />
              <Route
                path="/admin/teachers/:teacherId"
                element={<AdminTeacherDetailPage />}
              />
              <Route path="/admin/problems" element={<TopicListPage />} />
              <Route
                path="/admin/students/tracking"
                element={<StudentTrackingPage />}
              />
              <Route
                path="/admin/change-password"
                element={<ChangePasswordPage />}
              />
            </Route>
          </Route>
          <Route element={<RoleRoute roles={["TEACHER"]} />}>
            <Route element={<TeacherLayout />}>
              <Route
                path="/teacher/dashboard"
                element={<TeacherDashboardPage />}
              />
              <Route
                path="/teacher/rooms/:roomId/monitor"
                element={<RoomMonitorPage />}
              />
              <Route
                path="/teacher/classes"
                element={<TeacherClassListPage />}
              />
              <Route
                path="/teacher/classes/:classId"
                element={<TeacherClassDetailPage />}
              />
              <Route
                path="/teacher/rooms/:roomId/configure"
                element={<RoomConfigurePage />}
              />
              <Route
                path="/teacher/classes/:classId/configure"
                element={<RoomConfigurePage />}
              />
              <Route path="/teacher/history" element={<RoomHistoryPage />} />
              <Route
                path="/teacher/students/tracking"
                element={<StudentTrackingPage />}
              />
              <Route
                path="/teacher/history/:sessionId"
                element={<HistoryDetailPage />}
              />
              <Route
                path="/teacher/change-password"
                element={<ChangePasswordPage />}
              />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/join" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
