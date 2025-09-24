import React, { useState, useEffect, useRef } from "react";
import {
  FaCamera,
  FaEdit,
  FaSave,
  FaTimes,
  FaUser,
  FaPhone,
  FaGraduationCap,
  FaUsers,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import Select from "react-select";
import userService from "../../services/user.service";
import useAuth from "../../hooks/useAuth";
import { getUserIdFromToken, getToken } from "../../auth/authUtils";
import { useProfileStudent } from "../../contexts/ProfileStudentContext";

const StudentProfile = () => {
  // Hook authentication
  const { user } = useAuth();
  // Hook profile context
  const { profileData, updateProfileData } = useProfileStudent();

  // State cho active tab
  const [activeTab, setActiveTab] = useState("personal");

  // State cho trạng thái chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);

  // State cho loading
  const [isLoading, setIsLoading] = useState(true);

  // State cho form data - khởi tạo từ context
  const [formData, setFormData] = useState(profileData);

  // State cho form data tạm thời khi chỉnh sửa
  const [tempFormData, setTempFormData] = useState({ ...profileData });

  // State cho status message
  const [statusMessage, setStatusMessage] = useState(
    "Tất cả thay đổi đã được lưu"
  );

  // State cho avatar file
  const [avatarFile, setAvatarFile] = useState(null);

  // State cho error
  const [error, setError] = useState(null);

  // Sử dụng hàm getUserIdFromToken từ authUtils
  // const getUserIdFromToken = () => { ... } - Đã xóa, sử dụng từ authUtils

  // Fetch profile data từ API (chỉ khi cần thiết)
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = getUserIdFromToken();
      if (!userId) {
        throw new Error("Không thể lấy userId từ token");
      }

      const responseData = await userService.getStudentProfile(userId);
      if (responseData) {
        const newProfileData = {
          fullName: responseData.fullName || "",
          phoneNumber: responseData.phoneNumber || "",
          status: responseData.status || 1,
          major: responseData.major || "",
          className: responseData.className || "",
          avt: responseData.avt || "",
          studentId: responseData.userId?.toString() || "",
          email: responseData.email || "",
        };

        setFormData(newProfileData);
        setTempFormData(newProfileData);
        // Cập nhật context
        updateProfileData(newProfileData);
      }
    } catch (error) {
      console.error("Lỗi khi fetch profile data:", error);
      setError("Không thể tải thông tin profile. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load profile data khi component mount (chỉ khi context chưa có dữ liệu)
  useEffect(() => {
    if (!profileData.fullName && !profileData.email) {
      fetchProfileData();
    } else {
      setIsLoading(false);
    }
  }, [profileData.fullName, profileData.email]);

  // Đồng bộ dữ liệu khi context thay đổi
  useEffect(() => {
    setFormData(profileData);
    setTempFormData(profileData);
  }, [profileData]);

  // Xử lý thay đổi input
  const handleInputChange = (field, value) => {
    setTempFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setStatusMessage("Có thay đổi chưa lưu...");
  };

  // Xử lý bắt đầu chỉnh sửa
  const handleStartEditing = () => {
    setTempFormData({ ...formData });
    setIsEditing(true);
    setStatusMessage("Đang chỉnh sửa...");
  };

  // Xử lý hủy chỉnh sửa
  const handleCancelEditing = () => {
    // Cleanup URL preview nếu có
    if (avatarFile) {
      URL.revokeObjectURL(avatarFile);
    }

    setTempFormData({ ...formData });
    setIsEditing(false);
    setAvatarFile(null);
    setStatusMessage("Tất cả thay đổi đã được lưu");
  };

  // Cleanup function để tránh memory leak
  useEffect(() => {
    return () => {
      // Cleanup URL.createObjectURL khi component unmount
      if (avatarFile) {
        URL.revokeObjectURL(avatarFile);
      }
      // Cleanup URL từ formData.avt nếu nó là object URL
      if (formData.avt && formData.avt.startsWith("blob:")) {
        URL.revokeObjectURL(formData.avt);
      }
    };
  }, [avatarFile, formData.avt]);

  // Cleanup URL preview khi avatarFile thay đổi
  useEffect(() => {
    return () => {
      if (avatarFile) {
        URL.revokeObjectURL(avatarFile);
      }
    };
  }, [avatarFile]);

  // Xử lý cập nhật profile
  const handleUpdateProfile = async () => {
    try {
      setStatusMessage("Đang cập nhật...");

      // Tạo FormData để gửi multipart request
      const formDataToSend = new FormData();

      // Thêm profile data
      const profileData = {
        phoneNumber: tempFormData.phoneNumber,
        major: tempFormData.major,
        className: tempFormData.className,
        userId: getUserIdFromToken(),
      };

      formDataToSend.append(
        "profile",
        new Blob([JSON.stringify(profileData)], {
          type: "application/json",
        })
      );

      // Thêm avatar file nếu có
      if (avatarFile) {
        formDataToSend.append("avtFile", avatarFile);
      }

      // Gọi API update profile
      const response = await userService.updateStudentProfile(formDataToSend);

      // Cập nhật state với dữ liệu từ API response (nếu có)
      let updatedData;
      if (response?.data) {
        updatedData = {
          ...tempFormData,
          // Cập nhật các trường có thể thay đổi từ backend
          avt: response.data.avt || tempFormData.avt,
          // Có thể thêm các trường khác nếu backend trả về
        };
      } else {
        // Nếu không có response data, dùng tempFormData
        // Đối với avatar, nếu có file mới thì cập nhật URL preview
        updatedData = { ...tempFormData };
        if (avatarFile) {
          // Tạo URL preview cho avatar mới
          updatedData.avt = URL.createObjectURL(avatarFile);
        }
      }

      // Cập nhật local state
      setFormData(updatedData);

      // Cập nhật context để header cũng được cập nhật
      updateProfileData(updatedData);

      setIsEditing(false);
      setAvatarFile(null);
      setStatusMessage("Tất cả thay đổi đã được lưu");
    } catch (error) {
      console.error("Lỗi khi cập nhật profile:", error);
      setStatusMessage("Có lỗi xảy ra khi cập nhật profile");
      // Có thể thêm xử lý cụ thể cho từng loại lỗi
      if (error.response?.status === 400) {
        setStatusMessage("Dữ liệu không hợp lệ, vui lòng kiểm tra lại");
      } else if (error.response?.status === 401) {
        setStatusMessage("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      }
    }
  };

  // Xử lý thay đổi ảnh
  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Kiểm tra file type
      if (!file.type.startsWith("image/")) {
        setStatusMessage("Vui lòng chọn file ảnh hợp lệ");
        return;
      }

      // Kiểm tra kích thước file (giới hạn 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setStatusMessage("File ảnh quá lớn, vui lòng chọn file nhỏ hơn 5MB");
        return;
      }

      // Cleanup URL preview cũ nếu có
      if (avatarFile) {
        URL.revokeObjectURL(avatarFile);
      }

      setAvatarFile(file);
      setStatusMessage("Ảnh đã được chọn, vui lòng lưu để cập nhật");
    }
  };

  // Hàm helper để hiển thị trạng thái
  const getStatusText = (status) => {
    return status === 1 ? "Hoạt động" : "Không hoạt động";
  };

  const getStatusColor = (status) => {
    return status === 1
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  // Options cho react-select chuyên ngành
  const majorOptions = [
    { value: "CNTT", label: "Công nghệ thông tin" },
    { value: "KHMT", label: "Khoa học máy tính" },
    { value: "KTMT", label: "Kỹ thuật máy tính" },
    { value: "HTTT", label: "Hệ thống thông tin" },
    { value: "KTPM", label: "Kỹ thuật phần mềm" },
  ];

  // Hàm helper để hiển thị tên chuyên ngành
  const getMajorDisplayName = (major) => {
    // Nếu major đã là tên đầy đủ thì trả về luôn
    if (typeof major === "string" && major.length > 3) {
      return major;
    }

    // Nếu là mã code thì map sang tên đầy đủ
    const majorMap = {
      CNTT: "Công nghệ thông tin",
      KHMT: "Khoa học máy tính",
      KTMT: "Kỹ thuật máy tính",
      HTTT: "Hệ thống thông tin",
      KTPM: "Kỹ thuật phần mềm",
    };
    return majorMap[major] || major;
  };

  // Hàm helper để lấy option hiện tại cho react-select
  const getCurrentMajorOption = (major) => {
    return majorOptions.find((option) => option.value === major) || null;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full bg-gray-50 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full bg-gray-50 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Có lỗi xảy ra
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProfileData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50">
      <style jsx>{`
        .select__control * {
          font-weight: 400 !important;
        }
        .select__single-value {
          font-weight: 400 !important;
        }
        .select__placeholder {
          font-weight: 400 !important;
        }
        .select__input {
          font-weight: 400 !important;
        }
        .select__option {
          font-weight: 400 !important;
        }
      `}</style>
      {/* Main Content */}
      <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-card p-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <img
                    src={
                      isEditing && avatarFile
                        ? URL.createObjectURL(avatarFile) // Hiển thị preview khi đang edit và có file mới
                        : formData.avt ||
                          "https://res.cloudinary.com/dj5jgcpoh/image/upload/v1755329521/avt_default_mcotwe.jpg"
                    }
                    alt="Student Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                      <FaCamera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {isEditing && (
                  <div className="text-center">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                      Thay đổi ảnh
                    </button>
                    {avatarFile && (
                      <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-700 font-medium">
                          Ảnh mới: {avatarFile.name}
                        </p>
                        <p className="text-xs text-green-600">
                          Kích thước:{" "}
                          {(avatarFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Student Info */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {formData.fullName || "Chưa cập nhật"}
                </h2>
              </div>

              {/* Academic Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Chuyên ngành:</span>
                  <span className="text-gray-900 font-medium">
                    {isEditing
                      ? getMajorDisplayName(tempFormData.major)
                      : getMajorDisplayName(formData.major) || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Lớp:</span>
                  <span className="text-gray-900 font-medium">
                    {isEditing ? tempFormData.className : formData.className}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-900 font-medium">
                    {user?.username || formData.email || "Chưa cập nhật"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!isEditing ? (
                  <button
                    onClick={handleStartEditing}
                    className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <FaEdit className="w-4 h-4" />
                    Chỉnh sửa hồ sơ
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handleUpdateProfile}
                      className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <FaSave className="w-4 h-4" />
                      Lưu thay đổi
                    </button>
                    <button
                      onClick={handleCancelEditing}
                      className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <FaTimes className="w-4 h-4" />
                      Hủy bỏ
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Profile Editing Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-card">
              {/* Tabs Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {[
                    {
                      id: "personal",
                      name: "Thông tin cá nhân",
                      current: activeTab === "personal",
                    },
                    {
                      id: "account",
                      name: "Cài đặt tài khoản",
                      current: activeTab === "account",
                    },
                    {
                      id: "password",
                      name: "Đổi mật khẩu",
                      current: activeTab === "password",
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        tab.current
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "personal" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Thông tin cá nhân
                    </h3>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Họ và tên
                        </label>
                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {formData.fullName || "Chưa cập nhật"}
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số điện thoại
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={tempFormData.phoneNumber}
                            onChange={(e) =>
                              handleInputChange("phoneNumber", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        ) : (
                          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                            {formData.phoneNumber || "Chưa cập nhật"}
                          </div>
                        )}
                      </div>

                      {/* Major */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chuyên ngành
                        </label>
                        {isEditing ? (
                          <Select
                            value={getCurrentMajorOption(tempFormData.major)}
                            onChange={(selectedOption) =>
                              handleInputChange(
                                "major",
                                selectedOption?.value || ""
                              )
                            }
                            options={majorOptions}
                            placeholder="Chọn chuyên ngành"
                            className="w-full"
                            classNamePrefix="select"
                            isClearable={false}
                            isSearchable={true}
                            styles={{
                              control: (provided, state) => ({
                                ...provided,
                                minHeight: "42px",
                                borderColor: state.isFocused
                                  ? "#3b82f6"
                                  : "#d1d5db",
                                boxShadow: state.isFocused
                                  ? "0 0 0 2px rgba(59, 130, 246, 0.5)"
                                  : "none",
                                "&:hover": {
                                  borderColor: "#3b82f6",
                                },
                                "& *": {
                                  fontWeight: "400 !important",
                                },
                              }),
                              option: (provided, state) => ({
                                ...provided,
                                backgroundColor: state.isSelected
                                  ? "#3b82f6"
                                  : state.isFocused
                                  ? "#eff6ff"
                                  : "white",
                                color: state.isSelected ? "white" : "#374151",
                                fontWeight: "400",
                                fontFamily: "inherit",
                                "&:hover": {
                                  backgroundColor: state.isSelected
                                    ? "#3b82f6"
                                    : "#eff6ff",
                                },
                              }),
                              singleValue: (provided) => ({
                                ...provided,
                                color: "#374151",
                                fontWeight: "400 !important",
                                fontFamily: "inherit",
                              }),
                              placeholder: (provided) => ({
                                ...provided,
                                color: "#9ca3af",
                                fontWeight: "400 !important",
                                fontFamily: "inherit",
                              }),
                              input: (provided) => ({
                                ...provided,
                                fontWeight: "400 !important",
                                fontFamily: "inherit",
                              }),
                              menu: (provided) => ({
                                ...provided,
                                fontWeight: "400",
                                fontFamily: "inherit",
                              }),
                            }}
                          />
                        ) : (
                          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                            {getMajorDisplayName(formData.major)}
                          </div>
                        )}
                      </div>

                      {/* Class Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lớp
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={tempFormData.className}
                            onChange={(e) =>
                              handleInputChange("className", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        ) : (
                          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                            {formData.className || "Chưa cập nhật"}
                          </div>
                        )}
                      </div>

                      {/* Email - read-only from username */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {user?.username || formData.email || "Chưa cập nhật"}
                        </div>
                      </div>
                    </div>

                    {/* Status Message */}
                    <div className="flex items-center space-x-2 text-sm">
                      <FaCheckCircle
                        className={`w-5 h-5 ${
                          statusMessage === "Đang chỉnh sửa..."
                            ? "text-orange-500"
                            : "text-green-500"
                        }`}
                      />
                      <span
                        className={`${
                          statusMessage === "Đang chỉnh sửa..."
                            ? "text-orange-600"
                            : "text-green-600"
                        }`}
                      >
                        {statusMessage}
                      </span>
                    </div>

                    {/* Thesis Final Score Section */}
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Kết quả học tập
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-semibold text-sm">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  fill="currentColor"
                                  viewBox="0 0 16 16"
                                >
                                  <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                                </svg>
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Điểm tổng kết ĐATN
                              </p>
                              <p className="text-lg font-bold text-primary-600">
                                {(
                                  formData.finalThesisScore ??
                                  formData.thesisScore ??
                                  formData.finalScore ??
                                  0
                                ).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "account" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Cài đặt tài khoản
                    </h3>

                    {/* Account Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Thông báo email
                          </h4>
                          <p className="text-sm text-gray-500">
                            Nhận thông báo qua email
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Chế độ riêng tư
                          </h4>
                          <p className="text-sm text-gray-500">
                            Hiển thị thông tin công khai
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "password" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Đổi mật khẩu
                    </h3>

                    {/* Password Change Form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mật khẩu hiện tại
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Nhập mật khẩu hiện tại"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mật khẩu mới
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Nhập mật khẩu mới"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Xác nhận mật khẩu mới
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Nhập lại mật khẩu mới"
                        />
                      </div>

                      <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Cập nhật mật khẩu
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
