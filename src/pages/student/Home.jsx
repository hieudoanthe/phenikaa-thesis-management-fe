import React from "react";
import { useNavigate } from "react-router-dom";

const StudentHome = () => {
  const navigate = useNavigate();

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <div className="p-4 sm:p-8 w-full">
      {/* Welcome Section */}
      <div className="text-center mb-12 p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Chào mừng bạn đến với Hệ thống Quản lý Luận văn
        </h1>
        <p className="text-lg opacity-90">Trang chủ dành cho sinh viên</p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div
          onClick={() => handleCardClick("/student/topic-registration")}
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:-translate-y-1 hover:border-blue-500"
        >
          <div className="text-4xl mb-4 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Đăng ký đề tài
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Đăng ký và chọn đề tài luận văn phù hợp
            </p>
          </div>
        </div>

        <div
          onClick={() => handleCardClick("/student/my-thesis")}
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:-translate-y-1 hover:border-blue-500"
        >
          <div className="text-4xl mb-4 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Đề tài của tôi
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Xem và quản lý đề tài đã đăng ký
            </p>
          </div>
        </div>


        <div
          onClick={() => handleCardClick("/student/submissions")}
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:-translate-y-1 hover:border-blue-500"
        >
          <div className="text-4xl mb-4 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              fill="currentColor"
              className="bi bi-file-earmark-pdf-fill"
              viewBox="0 0 16 16"
            >
              <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z" />
              <path
                fill-rule="evenodd"
                d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Nộp báo cáo
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Nộp và theo dõi báo cáo tiến độ luận văn
            </p>
          </div>
        </div>

        <div
          onClick={() => handleCardClick("/student/chat")}
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:-translate-y-1 hover:border-blue-500"
        >
          <div className="text-4xl mb-4 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Tin nhắn
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Trao đổi với giảng viên và nhóm
            </p>
          </div>
        </div>

        <div
          onClick={() => handleCardClick("/student/settings")}
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:-translate-y-1 hover:border-blue-500"
        >
          <div className="text-4xl mb-4 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Cài đặt
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Cấu hình tài khoản cá nhân
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 text-center shadow-md border border-gray-200">
          <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
          <div className="text-sm font-medium text-gray-600">
            Đề tài đã đăng ký
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 text-center shadow-md border border-gray-200">
          <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
          <div className="text-sm font-medium text-gray-600">
            Báo cáo đã nộp
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 text-center shadow-md border border-gray-200">
          <div className="text-3xl font-bold text-blue-600 mb-2">85%</div>
          <div className="text-sm font-medium text-gray-600">
            Tiến độ hoàn thành
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 text-center shadow-md border border-gray-200">
          <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
          <div className="text-sm font-medium text-gray-600">
            Tin nhắn chưa đọc
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
