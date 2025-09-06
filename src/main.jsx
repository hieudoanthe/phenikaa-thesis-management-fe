import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";
import App from "./App.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import LecturerHome from "./pages/lecturer/Home.jsx";
import LecturerDashboard from "./pages/lecturer/Dashboard.jsx";
import ThesisManagement from "./pages/lecturer/ThesisManagement.jsx";
import AssignmentManagement from "./pages/lecturer/AssignmentManagement.jsx";
import TeacherProfile from "./pages/lecturer/TeacherProfile.jsx";
import NotiOfTeacher from "./pages/lecturer/NotiOfTeacher.jsx";
import LecturerLayout from "./components/layout/lecturer/LecturerLayout.jsx";
import LecturerRoute from "./routers/LecturerRoute.jsx";
import StudentRoute from "./routers/StudentRoute.jsx";
import StudentLayout from "./components/layout/student/StudentLayout.jsx";
import PlaceholderPage from "./components/common/PlaceholderPage.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import { ProfileStudentProvider } from "./contexts/ProfileStudentContext";
import { ProfileTeacherProvider } from "./contexts/ProfileTeacherContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import SessionManager from "./components/common/SessionManager";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ThesisRegister from "./pages/student/ThesisRegister.jsx";
import TopicRegistration from "./pages/student/TopicRegistration.jsx";
import StudentHome from "./pages/student/Home.jsx";
import StudentNotifications from "./pages/student/Notifications.jsx";
import StudentChat from "./pages/student/Chat.jsx";
import LecturerChat from "./pages/lecturer/Chat.jsx";
import StudentProfile from "./pages/student/StudentProfile.jsx";
import MyThesis from "./pages/student/MyThesis.jsx";
import AssignmentsDetail from "./pages/student/AssignmentsDetail.jsx";
import SubmissionManagement from "./pages/student/SubmissionManagement.jsx";
import AdminRoute from "./routers/AdminRoute.jsx";
import AdminLayout from "./components/layout/admin/AdminLayout.jsx";
import GradingManagement from "./pages/lecturer/GradingManagement.jsx";
import StudentSubmissionsView from "./pages/lecturer/StudentSubmissionsView.jsx";

import AcademicYearManagement from "./pages/admin/AcademicYearManagement.jsx";
import DefenseSessionsSchedule from "./pages/admin/DefenseSessionsSchedule.jsx";
import DefenseScheduleManagement from "./pages/admin/DefenseScheduleManagement.jsx";
import RegistrationPeriodManagement from "./pages/admin/RegistrationPeriodManagement.jsx";
import StudentPeriodManagement from "./pages/admin/StudentPeriodManagement.jsx";
import StatisticsDashboard from "./pages/admin/StatisticsDashboard.jsx";
import SubmissionAnalytics from "./pages/admin/SubmissionAnalytics.jsx";
// Import CSS
import "./index.css";
import "react-toastify/dist/ReactToastify.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <SessionManager>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Route công khai - trang đăng nhập */}
              <Route path="/" element={<App />} />
              <Route path="/login" element={<App />} />

              {/* Route yêu cầu xác thực - Lecturer (chỉ cho TEACHER role) */}
              <Route
                path="/lecturer"
                element={
                  <LecturerRoute>
                    <ProfileTeacherProvider>
                      <NotificationProvider>
                        <LecturerLayout />
                      </NotificationProvider>
                    </ProfileTeacherProvider>
                  </LecturerRoute>
                }
              >
                <Route path="home" element={<LecturerHome />} />
                <Route path="dashboard" element={<LecturerDashboard />} />
                <Route path="thesis" element={<ThesisManagement />} />
                <Route path="assignments" element={<AssignmentManagement />} />
                <Route path="profile" element={<TeacherProfile />} />
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
                <Route path="grading" element={<GradingManagement />} />
                <Route
                  path="student-submissions"
                  element={<StudentSubmissionsView />}
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
                <Route path="chat" element={<LecturerChat />} />
                <Route path="notifications" element={<NotiOfTeacher />} />
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
                    <ProfileStudentProvider>
                      <StudentLayout />
                    </ProfileStudentProvider>
                  </StudentRoute>
                }
              >
                <Route path="home" element={<StudentHome />} />
                <Route path="topic" element={<ThesisRegister />} />
                <Route
                  path="topic-registration"
                  element={<TopicRegistration />}
                />
                <Route path="profile" element={<StudentProfile />} />
                <Route path="chat" element={<StudentChat />} />
                <Route
                  path="notifications"
                  element={<StudentNotifications />}
                />
                <Route path="my-thesis" element={<MyThesis />} />
                <Route path="assignments" element={<AssignmentsDetail />} />
                <Route path="submissions" element={<SubmissionManagement />} />
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

                <Route
                  path="academic-year"
                  element={<AcademicYearManagement />}
                />
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
                  element={<DefenseScheduleManagement />}
                />
                <Route
                  path="defense-sessions"
                  element={<DefenseSessionsSchedule />}
                />
                <Route
                  path="registration-period"
                  element={<RegistrationPeriodManagement />}
                />
                <Route
                  path="student-period"
                  element={<StudentPeriodManagement />}
                />
                <Route path="statistics" element={<StatisticsDashboard />} />
                <Route
                  path="submission-analytics"
                  element={<SubmissionAnalytics />}
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

          {/* Toast Container global */}
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            limit={3}
            style={{ zIndex: 99999 }}
            toastStyle={{ zIndex: 99999 }}
          />
        </AuthProvider>
      </SessionManager>
    </ErrorBoundary>
  </StrictMode>
);
