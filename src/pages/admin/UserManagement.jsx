import React, { useState, useEffect } from "react";
import Select from "react-select";
import AddUserModal from "../../components/modals/AddUserModal.jsx";
import ConfirmModal from "../../components/modals/ConfirmModal.jsx";
import { toast, ToastContainer } from "react-toastify";
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
  const pageSize = 6;
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch users từ API (server-side paging)
  const fetchUsers = async (page = currentPage, options = {}) => {
    const { initial = false } = options;
    try {
      if (initial) setIsInitialLoading(true);

      // Tạo params cho API call với server-side pagination
      const apiParams = {
        page: page,
        size: pageSize, // Sử dụng pageSize = 6 thay vì 1000
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
      toast.error("Lỗi khi tải danh sách người dùng!");
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

      toast.success("Cập nhật người dùng thành công!");
      cancelEdit();
    } catch (err) {
      console.error("Cập nhật người dùng thất bại:", err);
      toast.error("Cập nhật người dùng thất bại!");
    }
  };

  // Thay đổi trạng thái (Khóa/Mở khóa)
  const handleToggleLock = async (user) => {
    try {
      setStatusLoadingId(user.userId);
      const resp = await userService.changeStatusUser(user.userId);

      // Refetch dữ liệu mới từ API để cập nhật giao diện
      await fetchUsers();

      toast.success("Cập nhật trạng thái người dùng thành công!");
    } catch (err) {
      console.error("Cập nhật trạng thái thất bại:", err);
      toast.error("Cập nhật trạng thái thất bại!");
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
      toast.error("Dữ liệu không đầy đủ!");
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
      toast.error("Lỗi khi thêm người dùng. Vui lòng thử lại!");

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

      toast.success("Xóa người dùng thành công!");
    } catch (err) {
      console.error("Xóa người dùng thất bại:", err);
      toast.error("Xóa người dùng thất bại!");
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
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-white font-medium rounded-lg hover:bg-secondary-hover transition-colors duration-200 shadow-sm"
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
                  control: (base) => ({
                    ...base,
                    borderRadius: "8px",
                    minHeight: "40px",
                    fontSize: "0.95rem",
                    borderColor: "#d1d5db",
                    boxShadow: "none",
                  }),
                  option: (base, state) => ({
                    ...base,
                    fontSize: "0.95rem",
                    backgroundColor: getOptionBackgroundColor(state),
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
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors duration-200"
            />
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Họ và tên
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Vai trò
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] hidden sm:table-cell">
                  Email
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] hidden sm:table-cell">
                  Trạng thái
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
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
                          className="hidden sm:block h-8 w-8 sm:h-10 sm:w-10 rounded-full mr-2 sm:mr-3"
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
                        {getRoleDisplayList(user.roleIds).map((role, index) => (
                          <div key={index} className="leading-tight">
                            {role}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
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
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-medium border-none ${
                        user.status === 1
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
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
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          className="p-1.5 sm:p-2 text-info-500 hover:bg-info-50 rounded-lg transition-colors duration-200"
                          title="Chỉnh sửa"
                          aria-label="Chỉnh sửa"
                          onClick={() => startEdit(user)}
                        >
                          <i className="bi bi-pen text-base sm:text-lg"></i>
                        </button>
                        <button
                          type="button"
                          className="p-1.5 sm:p-2 text-error-500 hover:bg-error-50 rounded-lg transition-colors duration-200"
                          title="Xóa"
                          aria-label="Xóa người dùng"
                          onClick={() => handleDeleteUser(user.userId)}
                        >
                          <i className="bi bi-trash text-base sm:text-lg"></i>
                        </button>
                        <button
                          type="button"
                          className={`p-1.5 sm:p-2 rounded-lg transition-colors duration-200 ${
                            user.status === 2
                              ? "text-warning-500 hover:bg-warning-50"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                          title={user.status === 2 ? "Mở khóa" : "Khóa"}
                          aria-label={user.status === 2 ? "Mở khóa" : "Khóa"}
                          onClick={() => handleToggleLock(user)}
                        >
                          {statusLoadingId === user.userId ? (
                            <i className="bi bi-arrow-repeat spin text-base sm:text-lg"></i>
                          ) : (
                            <i className="bi bi-lock text-base sm:text-lg"></i>
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
          <div className="text-sm text-gray-700">
            Hiển thị{" "}
            {paginatedUsers.length > 0 ? currentPage * pageSize + 1 : 0} đến{" "}
            {currentPage * pageSize + paginatedUsers.length} trên{" "}
            {totalElements} bản ghi — Trang {currentPage + 1}/
            {Math.ceil(totalElements / pageSize)}
          </div>

          {/* Pagination - Hiển thị khi có nhiều hơn 1 trang */}
          {Math.ceil(totalElements / pageSize) > 1 ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                className="p-1.5 sm:p-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                disabled={currentPage === 0}
                onClick={() => {
                  handlePageChange(currentPage - 1);
                }}
              >
                <i className="bi bi-chevron-left text-sm sm:text-base"></i>
              </button>
              <button className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-medium text-gray-900 bg-secondary text-white rounded-lg">
                {currentPage + 1}
              </button>
              <span className="px-1 sm:px-2 text-sm text-gray-500">
                / {Math.ceil(totalElements / pageSize)}
              </span>
              <button
                className="p-1.5 sm:p-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                disabled={
                  currentPage + 1 >= Math.ceil(totalElements / pageSize)
                }
                onClick={() => {
                  handlePageChange(currentPage + 1);
                }}
              >
                <i className="bi bi-chevron-right text-sm sm:text-base"></i>
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Không có phân trang (chỉ có {filteredUsers.length} bản ghi)
            </div>
          )}
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

      {/* Toast Container */}
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
        limit={3}
        closeButton={true}
        theme="light"
        style={{ zIndex: 9999 }}
        toastStyle={{ zIndex: 9999 }}
      />
    </div>
  );
};

export default UserManagement;
