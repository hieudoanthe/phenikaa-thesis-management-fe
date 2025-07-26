import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Home from "./pages/user/home.jsx";
import ThesisList from "./pages/thesis/index.jsx";
import Dashboard from "./pages/admin/dashboard.jsx";
import TopicManagement from "./pages/admin/topic_management.jsx";
import UserManagement from "./pages/admin/user_management.jsx";
import LecturerHome from "./pages/lecturer/home.jsx";
import LecturerDashboard from "./pages/lecturer/dasboard.jsx";
import ThesisManagement from "./pages/lecturer/thesis_management.jsx";
import AssignmentManagement from "./pages/lecturer/assignment_management.jsx";
import LecturerLayout from "./components/layout/lecturer/lecturer_layout.jsx";
import PrivateRoute from "./routers/PrivateRoute.jsx";
import LecturerRoute from "./routers/LecturerRoute.jsx";
import StudentRoute from "./routers/StudentRoute.jsx";
import StudentLayout from "./components/layout/student/student_layout.jsx";
import PlaceholderPage from "./components/common/PlaceholderPage.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ThesisRegister from "./pages/student/thesis_register.jsx";
import TopicRegistration from "./pages/student/topic_registration.jsx";
// KHÔNG import StudentLayout, StudentHome nữa

// Import CSS
import "./styles/common/placeholder.css";
import AdminRoute from "./routers/AdminRoute.jsx";
import AdminLayout from "./components/layout/admin/admin_layout.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Route công khai - trang đăng nhập */}
            <Route path="/" element={<App />} />

            {/* Route yêu cầu xác thực - Student */}
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />

            <Route
              path="/thesis"
              element={
                <PrivateRoute>
                  <ThesisList />
                </PrivateRoute>
              }
            />

            {/* Route yêu cầu xác thực - Lecturer (chỉ cho TEACHER role) */}
            <Route
              path="/lecturer"
              element={
                <LecturerRoute>
                  <LecturerLayout />
                </LecturerRoute>
              }
            >
              <Route path="home" element={<LecturerHome />} />
              <Route path="dashboard" element={<LecturerDashboard />} />
              <Route path="thesis" element={<ThesisManagement />} />
              <Route path="assignments" element={<AssignmentManagement />} />
              <Route
                path="topics"
                element={
                  <PlaceholderPage
                    title="Quản lý Đề tài"
                    description="Tính năng quản lý đề tài dành cho giảng viên đang được phát triển."
                  />
                }
              />
              <Route
                path="students"
                element={
                  <PlaceholderPage
                    title="Quản lý Sinh viên"
                    description="Tính năng quản lý sinh viên dành cho giảng viên đang được phát triển."
                  />
                }
              />
              <Route
                path="grading"
                element={
                  <PlaceholderPage
                    title="Chấm điểm"
                    description="Tính năng chấm điểm đang được phát triển."
                  />
                }
              />
              <Route
                path="defense-schedule"
                element={
                  <PlaceholderPage
                    title="Lịch bảo vệ"
                    description="Tính năng quản lý lịch bảo vệ đang được phát triển."
                  />
                }
              />
              <Route
                path="chat"
                element={
                  <PlaceholderPage
                    title="Chat"
                    description="Tính năng chat đang được phát triển."
                  />
                }
              />
              <Route
                path="notifications"
                element={
                  <PlaceholderPage
                    title="Thông báo"
                    description="Tính năng quản lý thông báo đang được phát triển."
                  />
                }
              />
              <Route
                path="settings"
                element={
                  <PlaceholderPage
                    title="Cài đặt"
                    description="Tính năng cài đặt dành cho giảng viên đang được phát triển."
                  />
                }
              />
            </Route>

            {/* Route yêu cầu xác thực - Student (chỉ cho USER role) */}
            <Route
              path="/student"
              element={
                <StudentRoute>
                  <StudentLayout />
                </StudentRoute>
              }
            >
              <Route path="home" element={<Home />} />
              <Route path="topic" element={<ThesisRegister />} />
              <Route
                path="topic-registration"
                element={<TopicRegistration />}
              />
              {/* Có thể thêm các route con khác cho student ở đây */}
            </Route>

            {/* Route yêu cầu xác thực - Admin (chỉ cho ADMIN role) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="topic-management" element={<TopicManagement />} />
              <Route path="user-management" element={<UserManagement />} />
              <Route
                path="groups"
                element={
                  <PlaceholderPage
                    title="Quản lý Nhóm"
                    description="Tính năng quản lý nhóm đang được phát triển."
                  />
                }
              />
              <Route
                path="assignments"
                element={
                  <PlaceholderPage
                    title="Quản lý Nhiệm vụ"
                    description="Tính năng quản lý nhiệm vụ đang được phát triển."
                  />
                }
              />
              <Route
                path="defense-schedule"
                element={
                  <PlaceholderPage
                    title="Lịch Bảo vệ"
                    description="Tính năng quản lý lịch bảo vệ đang được phát triển."
                  />
                }
              />
              <Route
                path="statistics"
                element={
                  <PlaceholderPage
                    title="Thống kê"
                    description="Tính năng thống kê đang được phát triển."
                  />
                }
              />
              <Route
                path="notifications"
                element={
                  <PlaceholderPage
                    title="Thông báo"
                    description="Tính năng quản lý thông báo đang được phát triển."
                  />
                }
              />
              <Route
                path="settings"
                element={
                  <PlaceholderPage
                    title="Cài đặt"
                    description="Tính năng cài đặt đang được phát triển."
                  />
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
