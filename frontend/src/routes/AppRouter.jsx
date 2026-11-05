import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { AuthLayout } from "../layouts/AuthLayout";
import { StudentLayout } from "../layouts/StudentLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";
import { SuperAdminLayout } from "../layouts/SuperAdminLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import { TeacherLayout } from "../layouts/TeacherLayout";
import { PageSkeleton } from "../components/common/PageSkeleton";
import { getRoleHome } from "./roleHome";

const lazyNamed = (loader, exportName) =>
  lazy(() => loader().then((module) => ({ default: module[exportName] })));

const LoginPage = lazyNamed(() => import("../pages/auth/LoginPage"), "LoginPage");
const ChangePasswordPage = lazyNamed(
  () => import("../pages/auth/ChangePasswordPage"),
  "ChangePasswordPage",
);
const JoinRoomPage = lazyNamed(
  () => import("../pages/student/JoinRoomPage"),
  "JoinRoomPage",
);
const RulesPage = lazyNamed(() => import("../pages/student/RulesPage"), "RulesPage");
const StudentRoomPage = lazyNamed(
  () => import("../pages/student/StudentRoomPage"),
  "StudentRoomPage",
);
const RoomInputPage = lazyNamed(
  () => import("../pages/student/RoomInputPage"),
  "RoomInputPage",
);
const RoomWaitingPage = lazyNamed(
  () => import("../pages/student/RoomWaitingPage"),
  "RoomWaitingPage",
);
const RoomGamePage = lazyNamed(
  () => import("../pages/student/RoomGamePage"),
  "RoomGamePage",
);
const RoomResultPage = lazyNamed(
  () => import("../pages/student/RoomResultPage"),
  "RoomResultPage",
);
const SuperAdminDashboardPage = lazyNamed(
  () => import("../pages/super-admin/DashboardPage"),
  "DashboardPage",
);
const AdminDashboardPage = lazyNamed(
  () => import("../pages/admin/DashboardPage"),
  "DashboardPage",
);
const TeacherDashboardPage = lazyNamed(
  () => import("../pages/teacher/DashboardPage"),
  "DashboardPage",
);
const RoomMonitorPage = lazyNamed(
  () => import("../pages/teacher/RoomMonitorPage"),
  "RoomMonitorPage",
);
const TeacherClassListPage = lazyNamed(
  () => import("../pages/teacher/ClassListPage"),
  "ClassListPage",
);
const TeacherClassDetailPage = lazyNamed(
  () => import("../pages/teacher/ClassDetailPage"),
  "ClassDetailPage",
);
const RoomConfigurePage = lazyNamed(
  () => import("../pages/teacher/RoomConfigurePage"),
  "RoomConfigurePage",
);
const RoomHistoryPage = lazyNamed(
  () => import("../pages/teacher/RoomHistoryPage"),
  "RoomHistoryPage",
);
const HistoryDetailPage = lazyNamed(
  () => import("../pages/teacher/HistoryDetailPage"),
  "HistoryDetailPage",
);
const SchoolListPage = lazyNamed(
  () => import("../pages/super-admin/SchoolListPage"),
  "SchoolListPage",
);
const ClassListPage = lazyNamed(
  () => import("../pages/admin/ClassListPage"),
  "ClassListPage",
);
const TeacherListPage = lazyNamed(
  () => import("../pages/admin/TeacherListPage"),
  "TeacherListPage",
);
const TeacherFormPage = lazyNamed(
  () => import("../pages/admin/TeacherFormPage"),
  "TeacherFormPage",
);
const TopicListPage = lazyNamed(
  () => import("../pages/admin/TopicListPage"),
  "TopicListPage",
);
const ClassFormPage = lazyNamed(
  () => import("../pages/admin/ClassFormPage"),
  "ClassFormPage",
);
const AdminClassDetailPage = lazyNamed(
  () => import("../pages/admin/ClassDetailPage"),
  "ClassDetailPage",
);
const AdminTeacherDetailPage = lazyNamed(
  () => import("../pages/admin/TeacherDetailPage"),
  "TeacherDetailPage",
);
const SchoolDetailPage = lazyNamed(
  () => import("../pages/super-admin/SchoolDetailPage"),
  "SchoolDetailPage",
);
const SchoolFormPage = lazyNamed(
  () => import("../pages/super-admin/SchoolFormPage"),
  "SchoolFormPage",
);
const RequestLogsPage = lazyNamed(
  () => import("../pages/super-admin/RequestLogsPage"),
  "RequestLogsPage",
);
const StudentTrackingPage = lazyNamed(
  () => import("../pages/admin/StudentTrackingPage"),
  "StudentTrackingPage",
);

function HomeRedirect() {
  const { user } = useAuthContext();
  return <Navigate to={getRoleHome(user?.role)} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
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
      </Suspense>
    </BrowserRouter>
  );
}
