import React, { useState, useEffect } from "react";
import Select from "react-select";
import AddUserModal from "../../components/modals/AddUserModal.jsx";
import ConfirmModal from "../../components/modals/ConfirmModal.jsx";
import { toast } from "react-toastify";

// Helper hiển thị toast sử dụng react-toastify
const showToast = (message, type = "success") => {
  try {
    if (type === "error") return toast.error(message);
    if (type === "warning") return toast.warn(message);
    if (type === "info") return toast.info(message);
    return toast.success(message);
  } catch (err) {
    console.error("Không thể hiển thị toast:", err);
    (type === "success" ? console.log : console.error)(message);
  }
};
import { userService } from "../../services";

import "bootstrap-icons/font/bootstrap-icons.css";
import "react-toastify/dist/ReactToastify.css";

// Mapping roleIds sang tên hiển thị theo yêu cầu: STUDENT(1) -> ADMIN(2) -> TEACHER(3)
const roleMapping = {
  1: "Sinh viên",
  2: "Phòng ban",
  3: "Giảng viên",
};

// Ảnh đại diện mặc định khi không có avt từ backend
const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dj5jgcpoh/image/upload/v1757653001/c6e56503cfdd87da299f72dc416023d4_ghnzgz.jpg";

// Mapping roleIds sang role value cho filter
const roleValueMapping = {
  1: "Student",
  2: "Admin",
  3: "Teacher",
};

const roleOptions = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "Student", label: "Sinh viên" },
  { value: "Admin", label: "Phòng ban" },
  { value: "Teacher", label: "Giảng viên" },
];

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState(roleOptions[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      console.error("Lỗi khi lấy danh sách users:", error);
      setError("Không thể tải danh sách người dùng");
      showToast("Lỗi khi tải danh sách người dùng!", "error");
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
      console.warn("Trang không hợp lệ:", newPage);
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
    if (!roleIds || roleIds.length === 0) return "Chưa phân quyền";

    const roleNames = roleIds
      .map((roleId) => roleMapping[roleId])
      .filter(Boolean);
    return roleNames.join(", ");
  };

  // Hàm helper để lấy role display dạng list (mỗi role một dòng)
  const getRoleDisplayList = (roleIds) => {
    if (!roleIds || roleIds.length === 0) return "Chưa phân quyền";

    const roleNames = roleIds
      .map((roleId) => roleMapping[roleId])
      .filter(Boolean);
    return roleNames;
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
        return "Hoạt động";
      case 2:
        return "Bị chặn";
      case 0:
      default:
        return "Không hoạt động";
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

      showToast("Cập nhật người dùng thành công!", "success");
      cancelEdit();
    } catch (err) {
      console.error("Cập nhật người dùng thất bại:", err);
      showToast("Cập nhật người dùng thất bại!", "error");
    }
  };

  // Thay đổi trạng thái (Khóa/Mở khóa)
  const handleToggleLock = async (user) => {
    try {
      setStatusLoadingId(user.userId);
      const resp = await userService.changeStatusUser(user.userId);

      // Refetch dữ liệu mới từ API để cập nhật giao diện
      await fetchUsers();

      showToast("Cập nhật trạng thái người dùng thành công!");
    } catch (err) {
      console.error("Cập nhật trạng thái thất bại:", err);
      showToast("Cập nhật trạng thái thất bại!");
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
      console.error("Dữ liệu không đầy đủ");
      showToast("Dữ liệu không đầy đủ!");
      throw new Error("Dữ liệu không đầy đủ");
    }

    try {
      // Gọi API để tạo user
      const response = await userService.createUser(userData);

      // 🔄 REFRESH: Refetch dữ liệu mới ở nền để không chặn đóng modal
      fetchUsers();

      // Trả về kết quả để modal biết đã thành công
      return response;
    } catch (error) {
      console.error("Lỗi khi tạo user:", error);

      // Hiển thị thông báo lỗi
      showToast("Lỗi khi thêm người dùng. Vui lòng thử lại!");

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

      showToast("Xóa người dùng thành công!");
    } catch (err) {
      console.error("Xóa người dùng thất bại:", err);
      showToast("Xóa người dùng thất bại!");
    } finally {
      setConfirmState({ open: false, userId: null, loading: false });
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách người dùng...</p>
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
            Thử lại
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
              <span className="hidden sm:inline">Thêm người dùng</span>
              <span className="sm:hidden">Thêm</span>
            </button>

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
              placeholder="Tìm kiếm người dùng..."
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
                    Họ và tên
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
                    Email
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
                    Vai trò
                  </label>
                  <Select
                    value={editDraft.roleIds.map((id) => ({
                      value: id,
                      label: roleMapping[id],
                    }))}
                    onChange={(opts) =>
                      setEditDraft((d) => ({
                        ...d,
                        roleIds: (opts || []).map((o) => o.value),
                      }))
                    }
                    options={[1, 2, 3].map((id) => ({
                      value: id,
                      label: roleMapping[id],
                    }))}
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
                    Lưu
                  </button>
                  <button
                    type="button"
                    className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium"
                    onClick={cancelEdit}
                  >
                    Hủy
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
                    <div className="mt-1 flex flex-wrap gap-1">
                      {getRoleDisplayList(user.roleIds).map((r, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-800 text-sm hover:bg-gray-50"
                      onClick={() => startEdit(user)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-error-300 text-error-600 text-sm hover:bg-error-50/40"
                      onClick={() => handleDeleteUser(user.userId)}
                    >
                      Xóa
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
                      {user.status === 2 ? "Mở khóa" : "Khóa"}
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
                  Họ và tên
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">
                  Vai trò
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Email
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Trạng thái
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                  Hành động
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
                        value={editDraft.roleIds.map((id) => ({
                          value: id,
                          label: roleMapping[id],
                        }))}
                        onChange={(opts) =>
                          setEditDraft((d) => ({
                            ...d,
                            roleIds: (opts || []).map((o) => o.value),
                          }))
                        }
                        options={[1, 2, 3].map((id) => ({
                          value: id,
                          label: roleMapping[id],
                        }))}
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
                        {getRoleDisplayList(user.roleIds).map((role, i) => (
                          <div key={i} className="leading-tight">
                            {role}
                          </div>
                        ))}
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
                          title="Lưu"
                          aria-label="Lưu"
                          onClick={() => saveEdit(user)}
                        >
                          <i className="bi bi-check2 text-base sm:text-lg"></i>
                        </button>
                        <button
                          type="button"
                          className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          title="Hủy"
                          aria-label="Hủy"
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
                          title="Chỉnh sửa"
                          aria-label="Chỉnh sửa"
                        >
                          <i className="bi bi-pen text-lg"></i>
                        </button>
                        <button
                          type="button"
                          className="p-2 text-error-500 hover:bg-error-50 rounded-lg"
                          onClick={() => handleDeleteUser(user.userId)}
                          title="Xóa"
                          aria-label="Xóa"
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
                          title={user.status === 2 ? "Mở khóa" : "Khóa"}
                          aria-label={user.status === 2 ? "Mở khóa" : "Khóa"}
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
            <span className="text-sm text-gray-600">Hiển thị</span>
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
            <span className="text-sm text-gray-600">bản ghi/trang</span>
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
                        Đầu
                      </button>
                      <button
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={current === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        aria-label="Trang trước"
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      {pages.map((p) => (
                        <button
                          key={p}
                          className={`${
                            p === current
                              ? "bg-primary-500 text-white"
                              : "bg-white text-gray-800 hover:bg-primary-50"
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
                        aria-label="Trang sau"
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                      <button
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={current === totalPageCount}
                        onClick={() => handlePageChange(totalPageCount - 1)}
                      >
                        Cuối
                      </button>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <span className="text-sm text-gray-500">
                Không có phân trang (chỉ có {filteredUsers.length} bản ghi)
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

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmState.open}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa người dùng này?"
        confirmText="Xóa"
        cancelText="Hủy"
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
