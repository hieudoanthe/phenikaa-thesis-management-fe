import React, { useState, useEffect } from "react";
import {
  FaCamera,
  FaCheckCircle,
  FaEdit,
  FaSave,
  FaTimes,
  FaEnvelope,
  FaPhone,
  FaGraduationCap,
  FaUsers,
  FaBookOpen,
} from "react-icons/fa";
import Select from "react-select";
import userService from "../../services/user.service";
import useAuth from "../../hooks/useAuth";
import { getToken } from "../../auth/authUtils";
import { useProfileTeacher } from "../../contexts/ProfileTeacherContext";

const TeacherProfile = () => {
  // Hook authentication
  const { user } = useAuth();
  // Hook profile context
  const { profileData, updateProfileData, isLoading, error, fetchProfileData } =
    useProfileTeacher();

  // State cho active tab
  const [activeTab, setActiveTab] = useState("lecturer-info");

  // State cho trạng thái chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);

  // State cho form data tạm thời khi chỉnh sửa
  const [tempFormData, setTempFormData] = useState({ ...profileData });

  // State cho status message
  const [statusMessage, setStatusMessage] = useState(
    "Tất cả thay đổi đã được lưu"
  );

  // State cho avatar file
  const [avatarFile, setAvatarFile] = useState(null);

  // Lấy userId từ access token
  const getUserIdFromToken = () => {
    try {
      const token = getToken();
      if (!token) return null;

      // Decode JWT token để lấy userId
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || payload.sub || null;
    } catch (error) {
      console.error("Lỗi khi decode token:", error);
      return null;
    }
  };

  // Đồng bộ dữ liệu khi context thay đổi
  useEffect(() => {
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
    setTempFormData({ ...profileData });
    setIsEditing(true);
    setStatusMessage("Đang chỉnh sửa...");
  };

  // Xử lý hủy chỉnh sửa
  const handleCancelEditing = () => {
    // Cleanup URL preview nếu có
    if (avatarFile) {
      URL.revokeObjectURL(avatarFile);
    }

    setTempFormData({ ...profileData });
    setIsEditing(false);
    setAvatarFile(null);
    setStatusMessage("Tất cả thay đổi đã được lưu");
  };

  // Cleanup function để tránh memory leak
  useEffect(() => {
    return () => {
      if (avatarFile) {
        URL.revokeObjectURL(avatarFile);
      }
      if (profileData.avt && profileData.avt.startsWith("blob:")) {
        URL.revokeObjectURL(profileData.avt);
      }
    };
  }, [avatarFile, profileData.avt]);

  // Xử lý cập nhật profile
  const handleUpdateProfile = async () => {
    try {
      // Validation các trường bắt buộc
      if (!tempFormData.phoneNumber || tempFormData.phoneNumber.trim() === "") {
        setStatusMessage("Số điện thoại không được để trống");
        return;
      }

      // Validation số điện thoại (chỉ cho phép số và dấu +, -, khoảng trắng)
      if (!/^[\d\s+\-()]+$/.test(tempFormData.phoneNumber)) {
        setStatusMessage(
          "Số điện thoại chỉ được chứa số và các ký tự +, -, (, ), khoảng trắng"
        );
        return;
      }

      if (!tempFormData.department || tempFormData.department.trim() === "") {
        setStatusMessage("Vui lòng chọn khoa");
        return;
      }

      if (
        !tempFormData.specialization ||
        tempFormData.specialization.trim() === ""
      ) {
        setStatusMessage("Vui lòng chọn chuyên ngành");
        return;
      }

      if (
        !tempFormData.maxStudents ||
        tempFormData.maxStudents < 1 ||
        tempFormData.maxStudents > 15
      ) {
        setStatusMessage("Số lượng sinh viên tối đa phải từ 1-15");
        return;
      }

      // Validation số lượng sinh viên hiện tại không được vượt quá số lượng tối đa
      if (profileData.currentStudents > tempFormData.maxStudents) {
        setStatusMessage(
          "Số lượng sinh viên tối đa không được nhỏ hơn số lượng sinh viên hiện tại"
        );
        return;
      }

      setStatusMessage("Đang cập nhật...");

      // Tạo FormData để gửi multipart request
      const formDataToSend = new FormData();

      // Thêm profile data
      const profileDataToSend = {
        phoneNumber: tempFormData.phoneNumber,
        department: tempFormData.department,
        specialization: tempFormData.specialization,
        maxStudents: tempFormData.maxStudents,
        userId: getUserIdFromToken(),
      };

      formDataToSend.append(
        "profile",
        new Blob([JSON.stringify(profileDataToSend)], {
          type: "application/json",
        })
      );

      // Thêm avatar file nếu có
      if (avatarFile) {
        // Validation kích thước file (giới hạn 5MB)
        if (avatarFile.size > 5 * 1024 * 1024) {
          setStatusMessage("File ảnh quá lớn, vui lòng chọn file nhỏ hơn 5MB");
          return;
        }

        // Validation loại file
        if (!avatarFile.type.startsWith("image/")) {
          setStatusMessage("Vui lòng chọn file ảnh hợp lệ");
          return;
        }

        formDataToSend.append("avtFile", avatarFile);
      }

      // Gọi API update profile
      const response = await userService.updateTeacherProfile(formDataToSend);

      // Cập nhật context với dữ liệu mới
      let updatedData = { ...tempFormData };
      if (response?.data) {
        // Cập nhật các trường có thể thay đổi từ backend
        updatedData.avt = response.data.avt || tempFormData.avt;
      } else if (avatarFile) {
        // Tạo URL preview cho avatar mới nếu không có response data
        updatedData.avt = URL.createObjectURL(avatarFile);
      }

      // Cập nhật context
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

  // Options cho react-select
  const departmentOptions = [
    { value: "CNTT", label: "Công nghệ thông tin" },
    { value: "KHMT", label: "Khoa học máy tính" },
    { value: "KTMT", label: "Kỹ thuật máy tính" },
    { value: "HTTT", label: "Hệ thống thông tin" },
    { value: "KTPM", label: "Kỹ thuật phần mềm" },
  ];

  const specializationOptions = [
    { value: "CNPM", label: "Công nghệ phần mềm" },
    { value: "HTTT", label: "Hệ thống thông tin" },
    { value: "KHMT", label: "Khoa học máy tính" },
    { value: "KTMT", label: "Kỹ thuật máy tính" },
    { value: "MMT", label: "Mạng máy tính" },
  ];

  // Hàm helper để lấy option hiện tại cho react-select
  const getCurrentOption = (value, options) => {
    return options.find((option) => option.value === value) || null;
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
                        ? URL.createObjectURL(avatarFile)
                        : profileData.avt ||
                          "https://res.cloudinary.com/dj5jgcpoh/image/upload/v1755329521/avt_default_mcotwe.jpg"
                    }
                    alt="Teacher Profile"
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

              {/* Teacher Info */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {profileData.fullName}
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                  Chuyên ngành: {profileData.specialization || "Chưa cập nhật"}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Khoa: {profileData.department || "Chưa cập nhật"}
                </p>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 text-sm">
                  <FaEnvelope className="text-gray-400 w-4 h-4" />
                  <span className="text-gray-900">
                    {user?.username || profileData.email || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <FaPhone className="text-gray-400 w-4 h-4" />
                  <span className="text-gray-900">
                    {profileData.phoneNumber || "Chưa cập nhật"}
                  </span>
                </div>
              </div>

              {/* Student Capacity Progress */}
              <div className="mb-4">
                <div className="text-sm mb-2">
                  <span className="text-gray-600">
                    Số lượng sinh viên có thể hướng dẫn
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-lg h-3 mb-2">
                  <div
                    className="bg-blue-600 h-3 rounded-lg transition-all duration-300"
                    style={{
                      width: `${
                        profileData.maxStudents && profileData.maxStudents > 0
                          ? Math.min(
                              ((profileData.currentStudents || 0) /
                                profileData.maxStudents) *
                                100,
                              100
                            )
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="text-right text-sm font-medium text-gray-900">
                  {profileData.currentStudents || 0}/
                  {profileData.maxStudents || 0} sinh viên
                </div>
              </div>

              {/* Current Topics */}
              <div className="mb-6">
                <div className="text-center text-sm text-gray-600">
                  Số đề tài đang hướng dẫn: {profileData.currentTopics || 0}
                </div>
                {profileData.maxStudents &&
                  profileData.maxStudents > 0 &&
                  (profileData.currentStudents || 0) <
                    profileData.maxStudents && (
                    <div className="text-center mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800">
                        <FaCheckCircle className="w-3 h-3 mr-1" />
                        Có thể nhận thêm đề tài
                      </span>
                    </div>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!isEditing ? (
                  <button
                    onClick={handleStartEditing}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <FaEdit className="w-4 h-4" />
                    Chỉnh sửa thông tin
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handleUpdateProfile}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
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
                      id: "lecturer-info",
                      name: "Thông tin giảng viên",
                      current: activeTab === "lecturer-info",
                    },
                    {
                      id: "guidance-topics",
                      name: "Đề tài hướng dẫn",
                      current: activeTab === "guidance-topics",
                    },
                    {
                      id: "account-settings",
                      name: "Cài đặt tài khoản",
                      current: activeTab === "account-settings",
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
                {activeTab === "lecturer-info" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Thông tin giảng viên
                    </h3>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Họ và tên
                        </label>
                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {profileData.fullName || "Chưa cập nhật"}
                        </div>
                      </div>

                      {/* Username */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {user?.username || "Chưa cập nhật"}
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
                            {profileData.phoneNumber || "Chưa cập nhật"}
                          </div>
                        )}
                      </div>

                      {/* Department */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Khoa
                        </label>
                        {isEditing ? (
                          <Select
                            value={getCurrentOption(
                              tempFormData.department,
                              departmentOptions
                            )}
                            onChange={(selectedOption) =>
                              handleInputChange(
                                "department",
                                selectedOption?.value || ""
                              )
                            }
                            options={departmentOptions}
                            placeholder="Chọn khoa"
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
                              }),
                              option: (provided, state) => ({
                                ...provided,
                                backgroundColor: state.isSelected
                                  ? "#3b82f6"
                                  : state.isFocused
                                  ? "#eff6ff"
                                  : "white",
                                color: state.isSelected ? "white" : "#374151",
                                "&:hover": {
                                  backgroundColor: state.isSelected
                                    ? "#3b82f6"
                                    : "#eff6ff",
                                },
                              }),
                            }}
                          />
                        ) : (
                          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                            {profileData.department || "Chưa cập nhật"}
                          </div>
                        )}
                      </div>

                      {/* Specialization */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chuyên ngành
                        </label>
                        {isEditing ? (
                          <Select
                            value={getCurrentOption(
                              tempFormData.specialization,
                              specializationOptions
                            )}
                            onChange={(selectedOption) =>
                              handleInputChange(
                                "specialization",
                                selectedOption?.value || ""
                              )
                            }
                            options={specializationOptions}
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
                              }),
                              option: (provided, state) => ({
                                ...provided,
                                backgroundColor: state.isSelected
                                  ? "#3b82f6"
                                  : state.isFocused
                                  ? "#eff6ff"
                                  : "white",
                                color: state.isSelected ? "white" : "#374151",
                                "&:hover": {
                                  backgroundColor: state.isSelected
                                    ? "#3b82f6"
                                    : "#eff6ff",
                                },
                              }),
                            }}
                          />
                        ) : (
                          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                            {profileData.specialization || "Chưa cập nhật"}
                          </div>
                        )}
                      </div>

                      {/* Max Students */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số lượng sinh viên tối đa
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            max="15"
                            value={tempFormData.maxStudents}
                            onChange={(e) =>
                              handleInputChange(
                                "maxStudents",
                                parseInt(e.target.value)
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        ) : (
                          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                            {profileData.maxStudents || "Chưa cập nhật"}
                          </div>
                        )}
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
                  </div>
                )}

                {activeTab === "guidance-topics" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Đề tài hướng dẫn
                    </h3>

                    <div className="text-center py-12 text-gray-500">
                      <FaBookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">Chức năng đang được phát triển</p>
                      <p className="text-sm">
                        Sẽ có sớm trong phiên bản tiếp theo
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "account-settings" && (
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
