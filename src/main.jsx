import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Home from "./pages/user/home.jsx";
import ThesisList from "./pages/thesis/index.jsx";
import Dashboard from "./pages/admin/dashboard.jsx";
import TopicManagement from "./pages/admin/topic_management.jsx";
import UserManagement from "./pages/admin/user_management.jsx";
import LecturerHome from "./pages/lecturer/home.jsx";
import ThesisManagement from "./pages/lecturer/thesis_management.jsx";
import LecturerLayout from "./components/layout/lecturer/lecturer_layout.jsx";
import PrivateRoute from "./routers/PrivateRoute.jsx";
import LecturerRoute from "./routers/LecturerRoute.jsx";
import PlaceholderPage from "./components/common/PlaceholderPage.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import CSS
import "./styles/common/placeholder.css";

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
              <Route
                path="dashboard"
                element={
                  <PlaceholderPage
                    title="Dashboard Giảng viên"
                    description="Tính năng dashboard dành cho giảng viên đang được phát triển."
                  />
                }
              />
              <Route path="thesis" element={<ThesisManagement />} />
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

            {/* Route yêu cầu xác thực - Admin */}
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin/topic-management"
              element={
                <PrivateRoute>
                  <TopicManagement />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin/user-management"
              element={
                <PrivateRoute>
                  <UserManagement />
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
