import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Home from "./pages/user/home.jsx";
import ThesisList from "./pages/thesis/index.jsx";
import Dashboard from "./pages/admin/dashboard.jsx";
import TopicManagement from "./pages/admin/topic_management.jsx";
import UserManagement from "./pages/admin/user_management.jsx";
import PrivateRoute from "./routers/PrivateRoute.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

            {/* Route yêu cầu xác thực - Lecturer */}
            <Route
              path="/lecturer/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/lecturer/thesis"
              element={
                <PrivateRoute>
                  <ThesisList />
                </PrivateRoute>
              }
            />

            <Route
              path="/lecturer/topics"
              element={
                <PrivateRoute>
                  <TopicManagement />
                </PrivateRoute>
              }
            />

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
