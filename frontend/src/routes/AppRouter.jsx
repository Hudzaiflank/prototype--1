import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { StudentLayout } from "../layouts/StudentLayout";
import { LoginPage } from "../pages/auth/LoginPage";
import { JoinRoomPage } from "../pages/student/JoinRoomPage";
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

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<StudentLayout />}>
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
            </Route>
          </Route>
          <Route element={<RoleRoute roles={["ADMIN"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            </Route>
          </Route>
          <Route element={<RoleRoute roles={["TEACHER"]} />}>
            <Route element={<TeacherLayout />}>
              <Route
                path="/teacher/dashboard"
                element={<TeacherDashboardPage />}
              />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/join" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
