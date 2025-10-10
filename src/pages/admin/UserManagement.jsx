import React, { useState, useEffect } from "react";
import Select from "react-select";
import AddUserModal from "../../components/modals/AddUserModal.jsx";
import ConfirmModal from "../../components/modals/ConfirmModal.jsx";
import ImportTeachersModal from "../../components/modals/ImportTeachersModal.jsx";
import { showToast } from "../../utils/toastHelper";
import { userService } from "../../services";
import { useTranslation } from "react-i18next";

import "bootstrap-icons/font/bootstrap-icons.css";
import "react-toastify/dist/ReactToastify.css";

// Mapping roleIds sang tên hiển thị theo yêu cầu: STUDENT(1) -> ADMIN(2) -> TEACHER(3)
const getRoleMapping = (t) => ({
  1: t("admin.userManagement.student"),
  2: t("admin.userManagement.admin"),
  3: t("admin.userManagement.teacher"),
});

// Ảnh đại diện mặc định khi không có avt từ backend
const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dj5jgcpoh/image/upload/v1757653001/c6e56503cfdd87da299f72dc416023d4_ghnzgz.jpg";

// Mapping roleIds sang role value cho filter
const roleValueMapping = {
  1: "Student",
  2: "Admin",
  3: "Teacher",
};

const UserManagement = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const roleOptions = [
    { value: "all", label: t("admin.userManagement.allRoles") },
    { value: "Student", label: t("admin.userManagement.student") },
    { value: "Admin", label: t("admin.userManagement.admin") },
    { value: "Teacher", label: t("admin.userManagement.teacher") },
  ];

  const [selectedRole, setSelectedRole] = useState(roleOptions[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportTeachersModalOpen, setIsImportTeachersModalOpen] =
    useState(false);
  const [users, setUsers] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    userId: null,
    loading: false,
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editDraft, setEditDraft] = useState({
    fullName: "",
    username: "",
    roleIds: [],
  });
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  // Phân trang phía server
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(6);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch users từ API (server-side paging)
  const fetchUsers = async (page = currentPage, options = {}) => {
    const { initial = false, size } = options;
    try {
      if (initial) setIsInitialLoading(true);

      // Tạo params cho API call với server-side pagination
      const apiParams = {
        page: page,
        size: typeof size === "number" ? size : pageSize,
      };

      // Gọi API với server-side pagination
      const response = await userService.getUsers(apiParams);

      const content = response?.content || [];

      // Map dữ liệu user và lấy ảnh đại diện đúng từ API (ưu tiên user.avt/user.avatar)
      const transformedUsers = content.map((user) => ({
        userId: user.userId,
        name: user.fullName,
        username: user.username,
        email: user.email || user.username,
        roleIds: user.roleIds,
        status: user.status,
        avatar: user.avt || user.avatar || DEFAULT_AVATAR,
        periodDescription:
          user.periodDescription || t("admin.userManagement.notRegistered"),
        periodIds: user.periodIds || [],
        totalRegistrations: user.totalRegistrations || 1,
      }));

      setUsers(transformedUsers);

      // Cập nhật totalElements từ API response
      if (typeof response?.totalElements === "number") {
        setTotalElements(response.totalElements);
      }

      // Cập nhật totalPages từ API response
      if (typeof response?.totalPages === "number") {
        setTotalPages(response.totalPages);
      }
    } catch (error) {
      console.error(t("admin.userManagement.errorLoadingUsersMessage"), error);
      setError(t("admin.userManagement.errorLoadingUsers"));
      showToast(t("admin.userManagement.errorLoadingUsersMessage"), "error");
    } finally {
      if (initial) setIsInitialLoading(false);
    }
  };

  /**
   * Xử lý thay đổi trang - gọi API để lấy dữ liệu mới
   */
  const handlePageChange = async (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      // Sử dụng biến local để đảm bảo giá trị chính xác
      const targetPage = newPage;

      // Cập nhật currentPage trước
      setCurrentPage(targetPage);

      // Gọi API để lấy dữ liệu trang mới
      await fetchUsers(targetPage);
    } else {
      console.warn(t("admin.userManagement.invalidPage"), newPage);
    }
  };

  useEffect(() => {
    fetchUsers(0, { initial: true });
  }, []);

  // Gọi API khi currentPage thay đổi
  useEffect(() => {
    if (currentPage > 0) {
      fetchUsers(currentPage);
    }
  }, [currentPage]);

  // Hàm helper để lấy role display từ roleIds
  const getRoleDisplay = (roleIds) => {
    if (!roleIds || roleIds.length === 0)
      return t("admin.userManagement.noRoleAssigned");

    const roleMapping = getRoleMapping(t);
    const roleNames = roleIds
      .map((roleId) => roleMapping[roleId])
      .filter(Boolean);
    return roleNames.join(", ");
  };

  // Hàm helper để lấy role display dạng list (mỗi role một dòng)
  const getRoleDisplayList = (roleIds) => {
    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) return [];

    const roleMapping = getRoleMapping(t);
    const roleNames = roleIds
      .map((roleId) => roleMapping[roleId])
      .filter(Boolean);
    return roleNames;
  };

  // Hàm helper để chuyển đổi period description sang ngôn ngữ hiện tại
  const translatePeriodDescription = (periodDescription) => {
    if (!periodDescription) return t("admin.userManagement.notRegistered");

    // Nếu periodDescription chứa "Đợt", thay thế bằng prefix tương ứng
    if (periodDescription.includes("Đợt")) {
      return periodDescription.replace(
        "Đợt",
        t("admin.userManagement.periodPrefix")
      );
    }

    return periodDescription;
  };

  // Hàm helper để kiểm tra user có role tương ứng không
  const hasRole = (userRoleIds, selectedRoleValue) => {
    if (selectedRoleValue === "all") return true;

    const roleId = Object.keys(roleValueMapping).find(
      (key) => roleValueMapping[key] === selectedRoleValue
    );

    return userRoleIds.includes(parseInt(roleId));
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = hasRole(user.roleIds, selectedRole.value);
    return matchesSearch && matchesRole;
  });

  // Sử dụng dữ liệu trực tiếp từ server (không cần client-side pagination)
  const paginatedUsers = filteredUsers;

  // Debug filteredUsers và paginatedUsers
  useEffect(() => {
    // removed debug logs
  }, [
    filteredUsers.length,
    paginatedUsers.length,
    currentPage,
    selectedRole.value,
    searchTerm,
  ]);

  // Debug log để kiểm tra dữ liệu
  // Reset về trang đầu tiên khi filter thay đổi
  useEffect(() => {
    setCurrentPage(0);
    // Gọi API để lấy dữ liệu trang đầu tiên với filter mới
    fetchUsers(0);
  }, [selectedRole.value, searchTerm]);

  // Hàm helper cho status
  const getStatusLabel = (status) => {
    switch (status) {
      case 1:
        return t("admin.userManagement.status.active");
      case 2:
        return t("admin.userManagement.status.blocked");
      case 0:
      default:
        return t("admin.userManagement.status.inactive");
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 1:
        return "active";
      case 2:
        return "blocked";
      case 0:
      default:
        return "inactive";
    }
  };

  const getOptionBackgroundColor = (state) => {
    if (state.isSelected) return "#2563eb";
    if (state.isFocused) return "#f3f4f6";
    return "#fff";
  };

  // Function để refresh dữ liệu (có thể gọi từ bên ngoài)
  const refreshData = async () => {
    await fetchUsers();
  };

  const startEdit = (user) => {
    setEditingUserId(user.userId);
    setEditDraft({
      fullName: user.name,
      username: user.email,
      roleIds: user.roleIds,
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditDraft({ fullName: "", username: "", roleIds: [] });
  };

  const saveEdit = async (user) => {
    const payload = {
      userId: user.userId,
      fullName: editDraft.fullName.trim(),
      username: editDraft.username.trim(),
      roleIds: editDraft.roleIds,
    };
    try {
      await userService.updateUser(payload);

      // Refetch dữ liệu mới từ API để cập nhật giao diện
      await fetchUsers();

      showToast(t("admin.userManagement.updateSuccess"), "success");
      cancelEdit();
    } catch (err) {
      console.error(t("admin.userManagement.updateFailed"), err);
      showToast(t("admin.userManagement.updateFailed"), "error");
    }
  };

  // Thay đổi trạng thái (Khóa/Mở khóa)
  const handleToggleLock = async (user) => {
    try {
      setStatusLoadingId(user.userId);
      const resp = await userService.changeStatusUser(user.userId);

      // Refetch dữ liệu mới từ API để cập nhật giao diện
      await fetchUsers();

      showToast(t("admin.userManagement.statusUpdateSuccess"), "success");
    } catch (err) {
      console.error(t("admin.userManagement.statusUpdateFailed"), err);
      showToast(t("admin.userManagement.statusUpdateFailed"), "error");
    } finally {
      setStatusLoadingId(null);
    }
  };

  // Thêm người dùng mới - Real-time update
  const handleAddUser = async (userData) => {
    // Kiểm tra dữ liệu
    if (
      !userData.fullName ||
      !userData.username ||
      !userData.password ||
      !userData.roleIds
    ) {
      console.error(t("admin.userManagement.incompleteData"), userData);
      showToast(t("admin.userManagement.incompleteDataMessage"), "error");
      throw new Error(t("admin.userManagement.incompleteData"));
    }

    try {
      // Gọi API để tạo user
      const response = await userService.createUser(userData);

      // 🔄 REFRESH: Refetch dữ liệu mới ở nền để không chặn đóng modal
      fetchUsers();

      // Trả về kết quả để modal biết đã thành công
      return response;
    } catch (error) {
      console.error(t("admin.userManagement.addUserError"), error);

      // Hiển thị thông báo lỗi
      showToast(t("admin.userManagement.addUserError"), "error");

      // Throw error để modal biết có lỗi
      throw error;
    }
  };

  const handleDeleteUser = (userId) => {
    setConfirmState({ open: true, userId, loading: false });
  };

  const confirmDelete = async () => {
    const { userId } = confirmState;
    if (!userId) {
      setConfirmState({ open: false, userId: null, loading: false });
      return;
    }
    try {
      setConfirmState((s) => ({ ...s, loading: true }));
      await userService.deleteUser(userId);

      // Refetch dữ liệu mới từ API để cập nhật giao diện
      await fetchUsers();

      // Nếu trang hiện tại rỗng sau khi xóa, lùi 1 trang
      if (users.length === 1 && currentPage > 0) {
        setCurrentPage((p) => p - 1);
      }

      showToast(t("admin.userManagement.deleteSuccess"), "success");
    } catch (err) {
      console.error(t("admin.userManagement.deleteFailed"), err);
      showToast(t("admin.userManagement.deleteFailed"), "error");
    } finally {
      setConfirmState({ open: false, userId: null, loading: false });
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          <p>{t("admin.userManagement.loadingData")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-error-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors duration-200"
          >
            {t("admin.userManagement.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left side - Add button and role filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-400 transition-colors duration-200 shadow-sm"
                onClick={() => setIsModalOpen(true)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                <span className="hidden sm:inline">
                  {t("admin.userManagement.addUser")}
                </span>
                <span className="sm:hidden">
                  {t("admin.userManagement.addUserShort")}
                </span>
              </button>

              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors duration-200 shadow-sm"
                onClick={() => setIsImportTeachersModalOpen(true)}
              >
                <span className="hidden sm:inline">
                  {t("admin.userManagement.addTeacher")}
                </span>
                <span className="sm:hidden">
                  {t("admin.userManagement.addTeacherShort")}
                </span>
              </button>
            </div>

            <div className="w-full sm:w-40">
              <Select
                value={selectedRole}
                onChange={setSelectedRole}
                options={roleOptions}
                isSearchable={false}
                className="custom-select"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderRadius: "8px",
                    minHeight: "42px",
                    height: "44px",
                    fontSize: "0.95rem",
                    borderColor: state.isFocused ? "#ff6600" : "#d1d5db",
                    boxShadow: state.isFocused ? "0 0 0 1px #ff6600" : "none",
                    "&:hover": { borderColor: "#ff6600" },
                  }),
                  option: (base, state) => ({
                    ...base,
                    fontSize: "0.95rem",
                    backgroundColor: state.isSelected
                      ? "#ff6600"
                      : state.isFocused
                      ? "#fff7ed"
                      : "#fff",
                    color: state.isSelected ? "#fff" : "#111827",
                    cursor: "pointer",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "#374151",
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: "8px",
                    zIndex: 20,
                  }),
                  dropdownIndicator: (base, state) => ({
                    ...base,
                    color: state.isFocused ? "#ff6600" : "#9ca3af",
                    "&:hover": { color: "#ff6600" },
                  }),
                }}
              />
            </div>
          </div>

          {/* Right side - Search */}
          <div className="relative flex-1 lg:flex-none lg:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder={t("admin.userManagement.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400 transition-colors duration-200"
            />
          </div>
        </div>
      </div>

      {/* Mobile list (cards) */}
      <div className="sm:hidden space-y-3">
        {paginatedUsers.map((user) => (
          <div
            key={user.userId}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            {editingUserId === user.userId ? (
              // Edit mode for mobile
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("admin.userManagement.fullName")}
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary text-sm"
                    value={editDraft.fullName}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, fullName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("admin.userManagement.email")}
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary text-sm"
                    value={editDraft.username}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, username: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("admin.userManagement.role")}
                  </label>
                  <Select
                    value={editDraft.roleIds.map((id) => {
                      const roleMapping = getRoleMapping(t);
                      return {
                        value: id,
                        label: roleMapping[id],
                      };
                    })}
                    onChange={(opts) =>
                      setEditDraft((d) => ({
                        ...d,
                        roleIds: (opts || []).map((o) => o.value),
                      }))
                    }
                    options={[1, 2, 3].map((id) => {
                      const roleMapping = getRoleMapping(t);
                      return {
                        value: id,
                        label: roleMapping[id],
                      };
                    })}
                    isMulti
                    isSearchable={false}
                    className="custom-select"
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    menuShouldScrollIntoView={false}
                    styles={{
                      menu: (b) => ({ ...b, zIndex: 3000 }),
                      menuPortal: (b) => ({ ...b, zIndex: 3000 }),
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    className="flex-1 px-3 py-2 bg-success text-white rounded-lg text-sm font-medium"
                    onClick={() => saveEdit(user)}
                  >
                    {t("admin.userManagement.save")}
                  </button>
                  <button
                    type="button"
                    className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium"
                    onClick={cancelEdit}
                  >
                    {t("admin.userManagement.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              // View mode for mobile
              <div className="flex items-start gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {user.name}
                    </h3>
                    <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          user.status === 1 ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      {getStatusLabel(user.status)}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600 break-words">
                    <div className="truncate">{user.email}</div>
                    <div className="mt-1 text-xs font-medium">
                      {!user.roleIds.includes(2) &&
                      !user.roleIds.includes(3) ? (
                        <span className="text-blue-600">
                          {translatePeriodDescription(user.periodDescription)}
                          {user.totalRegistrations > 1 &&
                            ` (${user.totalRegistrations} ${t(
                              "admin.userManagement.timesRegistered"
                            )})`}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {getRoleDisplayList(user.roleIds).length > 0 ? (
                        getRoleDisplayList(user.roleIds).map((r, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs"
                          >
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs">
                          {t("admin.userManagement.notAssigned")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-800 text-sm hover:bg-gray-50"
                      onClick={() => startEdit(user)}
                    >
                      {t("admin.userManagement.edit")}
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-error-300 text-error-600 text-sm hover:bg-error-50/40"
                      onClick={() => handleDeleteUser(user.userId)}
                    >
                      {t("admin.userManagement.delete")}
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50 ${
                        user.status === 2
                          ? "border-warning-300 text-warning-600"
                          : "border-gray-300 text-gray-700"
                      }`}
                      onClick={() => handleToggleLock(user)}
                    >
                      {user.status === 2
                        ? t("admin.userManagement.unlock")
                        : t("admin.userManagement.lock")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop/tablet table */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">
                  {t("admin.userManagement.fullName")}
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">
                  {t("admin.userManagement.role")}
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  {t("admin.userManagement.email")}
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                  {t("admin.userManagement.registrationPeriod")}
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  {t("admin.userManagement.statusLabel")}
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                  {t("admin.userManagement.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr
                  key={user.userId}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {editingUserId !== user.userId && (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-10 w-10 rounded-full mr-3 hidden md:block"
                        />
                      )}
                      {editingUserId === user.userId ? (
                        <input
                          className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors duration-200 text-sm"
                          value={editDraft.fullName}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              fullName: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">
                          {user.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {editingUserId === user.userId ? (
                      <Select
                        value={editDraft.roleIds.map((id) => {
                          const roleMapping = getRoleMapping(t);
                          return {
                            value: id,
                            label: roleMapping[id],
                          };
                        })}
                        onChange={(opts) =>
                          setEditDraft((d) => ({
                            ...d,
                            roleIds: (opts || []).map((o) => o.value),
                          }))
                        }
                        options={[1, 2, 3].map((id) => {
                          const roleMapping = getRoleMapping(t);
                          return {
                            value: id,
                            label: roleMapping[id],
                          };
                        })}
                        isMulti
                        isSearchable={false}
                        className="custom-select min-w-[150px] sm:min-w-[200px]"
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        menuPlacement="auto"
                        menuShouldScrollIntoView={false}
                        styles={{
                          menu: (b) => ({ ...b, zIndex: 3000 }),
                          menuPortal: (b) => ({ ...b, zIndex: 3000 }),
                        }}
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {getRoleDisplayList(user.roleIds).length > 0 ? (
                          getRoleDisplayList(user.roleIds).map((role, i) => (
                            <div key={i} className="leading-tight">
                              {role}
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500">
                            {t("admin.userManagement.notAssigned")}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {editingUserId === user.userId ? (
                      <input
                        className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors duration-200 text-sm"
                        value={editDraft.username}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            username: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{user.email}</div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {!user.roleIds.includes(2) && !user.roleIds.includes(3) ? (
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">
                          {translatePeriodDescription(user.periodDescription)}
                        </div>
                        {user.totalRegistrations > 1 && (
                          <div className="text-xs text-gray-500 mt-1">
                            ({user.totalRegistrations}{" "}
                            {t("admin.userManagement.timesRegistered")})
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">-</div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-medium ${
                        user.status === 1
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {getStatusLabel(user.status)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingUserId === user.userId ? (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          className="p-1.5 sm:p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors duration-200"
                          title={t("admin.userManagement.save")}
                          aria-label={t("admin.userManagement.save")}
                          onClick={() => saveEdit(user)}
                        >
                          <i className="bi bi-check2 text-base sm:text-lg"></i>
                        </button>
                        <button
                          type="button"
                          className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          title={t("admin.userManagement.cancel")}
                          aria-label={t("admin.userManagement.cancel")}
                          onClick={cancelEdit}
                        >
                          <i className="bi bi-x text-base sm:text-lg"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="p-2 text-info-500 hover:bg-info-50 rounded-lg"
                          onClick={() => startEdit(user)}
                          title={t("admin.userManagement.edit")}
                          aria-label={t("admin.userManagement.edit")}
                        >
                          <i className="bi bi-pen text-lg"></i>
                        </button>
                        <button
                          type="button"
                          className="p-2 text-error-500 hover:bg-error-50 rounded-lg"
                          onClick={() => handleDeleteUser(user.userId)}
                          title={t("admin.userManagement.delete")}
                          aria-label={t("admin.userManagement.delete")}
                        >
                          <i className="bi bi-trash text-lg"></i>
                        </button>
                        <button
                          type="button"
                          className={`p-2 rounded-lg ${
                            user.status === 2
                              ? "text-warning-500 hover:bg-warning-50"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                          onClick={() => handleToggleLock(user)}
                          title={
                            user.status === 2
                              ? t("admin.userManagement.unlock")
                              : t("admin.userManagement.lock")
                          }
                          aria-label={
                            user.status === 2
                              ? t("admin.userManagement.unlock")
                              : t("admin.userManagement.lock")
                          }
                        >
                          {statusLoadingId === user.userId ? (
                            <i className="bi bi-arrow-repeat spin text-lg"></i>
                          ) : (
                            <i className="bi bi-lock text-lg"></i>
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mt-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Page size selector - always visible */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-start">
            <span className="text-sm text-gray-600">
              {t("admin.userManagement.showRecords")}
            </span>
            <div className="min-w-[96px]">
              <Select
                value={{ value: pageSize, label: String(pageSize) }}
                onChange={async (opt) => {
                  const newSize = parseInt(opt?.value ?? 6, 10);
                  setPageSize(newSize);
                  setCurrentPage(0);
                  await fetchUsers(0, { size: newSize });
                }}
                options={[6, 10, 20, 50].map((n) => ({
                  value: n,
                  label: String(n),
                }))}
                isSearchable={false}
                className="custom-select"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: 36,
                    borderRadius: 8,
                    borderColor: state.isFocused ? "#ff6600" : "#d1d5db",
                    boxShadow: state.isFocused ? "0 0 0 1px #ff6600" : "none",
                    "&:hover": { borderColor: "#ff6600" },
                  }),
                  option: (base, state) => ({
                    ...base,
                    fontSize: "0.95rem",
                    backgroundColor: state.isSelected
                      ? "#ff6600"
                      : state.isFocused
                      ? "#fff7ed"
                      : "#fff",
                    color: state.isSelected ? "#fff" : "#111827",
                    cursor: "pointer",
                  }),
                  dropdownIndicator: (base, state) => ({
                    ...base,
                    color: state.isFocused ? "#ff6600" : "#9ca3af",
                    "&:hover": { color: "#ff6600" },
                  }),
                  menu: (base) => ({ ...base, zIndex: 20, borderRadius: 8 }),
                }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {t("admin.userManagement.recordsPerPage")}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-3">
            {/* Pagination - only show when multiple pages */}
            {Math.ceil(totalElements / pageSize) > 1 ? (
              <div className="flex items-center gap-3">
                {(() => {
                  const totalPageCount = Math.max(
                    1,
                    totalPages || Math.ceil(totalElements / pageSize)
                  );
                  const current = currentPage + 1;
                  const start = Math.max(1, current - 2);
                  const end = Math.min(totalPageCount, current + 2);
                  const pages = [];
                  for (let p = start; p <= end; p++) pages.push(p);
                  return (
                    <div className="inline-flex items-center bg-white border border-gray-200 rounded-[14px] overflow-hidden shadow-sm self-center sm:self-auto">
                      <button
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={current === 1}
                        onClick={() => handlePageChange(0)}
                      >
                        {t("admin.userManagement.first")}
                      </button>
                      <button
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={current === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        aria-label={t("admin.userManagement.previous")}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      {pages.map((p) => (
                        <button
                          key={p}
                          className={`${
                            p === current
                              ? "bg-accent-500 text-white"
                              : "bg-white text-gray-800 hover:bg-accent-50"
                          } px-3 py-2 text-sm border-x border-gray-200`}
                          onClick={() => handlePageChange(p - 1)}
                          aria-current={p === current ? "page" : undefined}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={current === totalPageCount}
                        onClick={() => handlePageChange(currentPage + 1)}
                        aria-label={t("admin.userManagement.next")}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                      <button
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={current === totalPageCount}
                        onClick={() => handlePageChange(totalPageCount - 1)}
                      >
                        {t("admin.userManagement.last")}
                      </button>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <span className="text-sm text-gray-500">
                {t("admin.userManagement.noPagination", {
                  count: filteredUsers.length,
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddUser={handleAddUser}
      />

      {/* Import Teachers Modal */}
      <ImportTeachersModal
        isOpen={isImportTeachersModalOpen}
        onClose={() => setIsImportTeachersModalOpen(false)}
        onImportSuccess={() => {
          fetchUsers();
          setIsImportTeachersModalOpen(false);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmState.open}
        title={t("admin.userManagement.confirmDelete")}
        message={t("admin.userManagement.confirmDeleteMessage")}
        confirmText={t("admin.userManagement.delete")}
        cancelText={t("admin.userManagement.cancel")}
        onConfirm={confirmDelete}
        onCancel={() =>
          setConfirmState({ open: false, userId: null, loading: false })
        }
        loading={confirmState.loading}
      />
    </div>
  );
};

export default UserManagement;
