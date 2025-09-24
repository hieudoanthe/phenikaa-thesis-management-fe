import React, { useState, useEffect, useRef } from "react";
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
import TopicService from "../../services/topic.service";
import useAuth from "../../hooks/useAuth";
import { getUserIdFromToken, getToken } from "../../auth/authUtils";
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

  // State cho đề tài hướng dẫn
  const [guidanceTopics, setGuidanceTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState(null);
  const [studentProfiles, setStudentProfiles] = useState({});

  // Đồng bộ dữ liệu khi context thay đổi
  useEffect(() => {
    setTempFormData(profileData);
  }, [profileData]);

  // Load đề tài hướng dẫn khi component mount
  useEffect(() => {
    loadGuidanceTopics();
  }, []);

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

      setStatusMessage("Đang cập nhật...");

      // Tạo FormData để gửi multipart request
      const formDataToSend = new FormData();

      // Thêm profile data
      const profileDataToSend = {
        phoneNumber: tempFormData.phoneNumber,
        department: tempFormData.department,
        specialization: tempFormData.specialization,
        degree: tempFormData.degree,
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

  // Department mapping
  const departmentMapping = {
    CNTT: "Công nghệ thông tin",
    KHMT: "Khoa học máy tính",
    KTMT: "Kỹ thuật máy tính",
    HTTT: "Hệ thống thông tin",
    KTPM: "Kỹ thuật phần mềm",
    ATTT: "An toàn thông tin",
    MMT: "Mạng máy tính",
    PM: "Phần mềm",
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

  // Transform API data để phù hợp với UI
  const transformThesisData = (apiData) => {
    if (!apiData || !Array.isArray(apiData)) return [];

    return apiData.map((topic) => ({
      id: topic.topicId,
      title: topic.title,
      description: topic.description,
      student: topic.suggestedBy
        ? `Sinh viên ID: ${topic.suggestedBy}`
        : "Chưa có sinh viên",
      studentId: topic.suggestedBy?.toString() || "Không có",
      suggestedBy: topic.suggestedBy,
      status: topic.approvalStatus === "APPROVED" ? "Đã duyệt" : "Đang chờ",
      startDate: topic.createdAt
        ? new Date(topic.createdAt).toISOString().split("T")[0]
        : "Không có",
      endDate: topic.updatedAt
        ? new Date(topic.updatedAt).toISOString().split("T")[0]
        : "Không có",
      maxStudents: topic.maxStudents,
      remainingSlots: topic.maxStudents,
    }));
  };

  // Helper: tải profile theo danh sách userId và lưu vào state
  const fetchProfilesForIds = async (userIds = []) => {
    const uniqueIds = Array.from(
      new Set(
        (userIds || []).filter(
          (id) => typeof id === "number" || typeof id === "string"
        )
      )
    );
    const need = uniqueIds.filter((id) => !studentProfiles[id]);
    if (need.length === 0) return studentProfiles;

    const fetched = {};
    for (const uid of need) {
      try {
        const profile = await userService.getStudentProfileById(uid);
        fetched[uid] = {
          fullName: profile.fullName || profile.name || "Không xác định",
          studentId: profile.userId || profile.studentId || profile.id || uid,
          email: profile.email || "",
          major: profile.major || "",
          className: profile.className || profile.class || "",
        };
      } catch (e) {
        fetched[uid] = {
          fullName: "Không xác định",
          studentId: uid,
          email: "",
          major: "",
          className: "",
        };
      }
    }
    const merged = { ...studentProfiles, ...fetched };
    setStudentProfiles(merged);
    return merged;
  };

  // Load danh sách đề tài hướng dẫn
  const loadGuidanceTopics = async () => {
    try {
      setTopicsLoading(true);
      setTopicsError(null);

      const response = await TopicService.getApprovedTopics({
        page: 0,
        size: 100,
      });

      if (response.success && response.data) {
        let topicsData = [];

        if (Array.isArray(response.data)) {
          topicsData = response.data;
        } else if (Array.isArray(response.data?.content)) {
          topicsData = response.data.content;
        } else if (Array.isArray(response.data?.data)) {
          topicsData = response.data.data;
        } else {
          topicsData = [];
        }

        const transformedData = transformThesisData(topicsData);
        setGuidanceTopics(transformedData);

        // Load thông tin profile của sinh viên
        const userIds = topicsData
          .map((topic) => topic.suggestedBy)
          .filter((id) => id);
        await fetchProfilesForIds(userIds);
      } else {
        setTopicsError(response.message || "Không thể lấy danh sách đề tài");
        setGuidanceTopics([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đề tài:", error);
      setTopicsError("Có lỗi xảy ra khi lấy danh sách đề tài");
      setGuidanceTopics([]);
    } finally {
      setTopicsLoading(false);
    }
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
                  Học vị: {profileData.degree || "Chưa cập nhật"}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Chuyên ngành: {profileData.specialization || "Chưa cập nhật"}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Khoa:{" "}
                  {departmentMapping[profileData.department] ||
                    profileData.department ||
                    "Chưa cập nhật"}
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

              {/* Current Topics */}
              <div className="mb-6">
                <div className="text-center text-sm text-gray-600">
                  Số đề tài đang hướng dẫn: {guidanceTopics.length}
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
                    Chỉnh sửa thông tin
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
                            {departmentMapping[profileData.department] ||
                              profileData.department ||
                              "Chưa cập nhật"}
                          </div>
                        )}
                      </div>

                      {/* Degree */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Học vị
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={tempFormData.degree || ""}
                            onChange={(e) =>
                              handleInputChange("degree", e.target.value)
                            }
                            placeholder="VD: ThS., TS., PGS.TS., ..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        ) : (
                          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                            {profileData.degree || "Chưa cập nhật"}
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
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        Đề tài hướng dẫn
                      </h3>
                      <button
                        onClick={loadGuidanceTopics}
                        disabled={topicsLoading}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          className="bi bi-arrow-repeat"
                          viewBox="0 0 16 16"
                        >
                          <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" />
                          <path
                            fillRule="evenodd"
                            d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z"
                          />
                        </svg>
                        Làm mới
                      </button>
                    </div>

                    {topicsLoading ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-sm text-gray-500">
                          Đang tải danh sách đề tài...
                        </p>
                      </div>
                    ) : topicsError ? (
                      <div className="text-center py-8">
                        <div className="text-red-600 text-6xl mb-4">⚠️</div>
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          Có lỗi xảy ra
                        </p>
                        <p className="text-gray-600 mb-4">{topicsError}</p>
                        <button
                          onClick={loadGuidanceTopics}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : guidanceTopics.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <FaBookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">
                          Chưa có đề tài nào được hướng dẫn
                        </p>
                        <p className="text-sm">
                          Các đề tài đã được approve sẽ hiển thị ở đây
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {guidanceTopics.map((topic) => (
                          <div
                            key={topic.id}
                            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                  {topic.title}
                                </h4>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                  {topic.description}
                                </p>
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-md border ${
                                  topic.status === "Đã duyệt"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {topic.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  fill="currentColor"
                                  className="bi bi-person-fill-check text-gray-500"
                                  viewBox="0 0 16 16"
                                >
                                  <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m1.679-4.493-1.335 2.226a.75.75 0 0 1-1.174.144l-.774-.773a.5.5 0 0 1 .708-.708l.547.548 1.17-1.951a.5.5 0 1 1 .858.514M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
                                  <path d="M2 13c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4" />
                                </svg>
                                <span className="text-gray-600">
                                  {(() => {
                                    const profile =
                                      studentProfiles[topic.suggestedBy];
                                    if (
                                      profile &&
                                      profile.fullName !== "Không xác định"
                                    ) {
                                      return profile.fullName;
                                    }
                                    return topic.student;
                                  })()}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  fill="currentColor"
                                  className="bi bi-calendar-week-fill text-gray-500"
                                  viewBox="0 0 16 16"
                                >
                                  <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M9.5 7h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5m3 0h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5M2 10.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5" />
                                </svg>
                                <span className="text-gray-600">
                                  {topic.startDate} - {topic.endDate}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  fill="currentColor"
                                  className="bi bi-people-fill text-gray-500"
                                  viewBox="0 0 16 16"
                                >
                                  <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />
                                </svg>
                                <span className="text-gray-600">
                                  Còn {topic.remainingSlots} chỗ trống
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
