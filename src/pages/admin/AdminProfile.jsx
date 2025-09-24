import React from "react";
import { useAuth } from "../../contexts/AuthContext";

const AdminProfile = () => {
  const { user } = useAuth();

  const displayName = user?.fullName || "Admin System";
  const email = user?.username || "admin@phenikaa.edu.vn";
  const roleLabel = "Quản trị viên";
  const initials = (displayName || "A")
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full bg-gray-50">
      <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-info to-info-dark text-white flex items-center justify-center text-3xl font-bold mb-3">
                  {initials}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">
                  {displayName}
                </h2>
                <p className="text-sm text-gray-600 mb-1">{roleLabel}</p>
                <p className="text-sm text-gray-600">{email}</p>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors font-medium">
                  Chỉnh sửa thông tin
                </button>
              </div>
            </div>
          </div>

          {/* Right - Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin tài khoản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {displayName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vai trò
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {roleLabel}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    Hoạt động
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
