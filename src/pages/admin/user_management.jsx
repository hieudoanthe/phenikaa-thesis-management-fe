import React, { useState, useEffect } from "react";
import Select from "react-select";
import AddUserModal from "../../components/modals/add_user_modal";
import ConfirmModal from "../../components/modals/confirm_modal";
import { ToastContainer } from "../../components/common";
import { userService } from "../../services";
import "../../styles/pages/admin/user_management.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// Mapping roleIds sang tên hiển thị
const roleMapping = {
  1: "Sinh viên",
  2: "Giảng viên",
  3: "Quản trị viên",
};

// Mapping roleIds sang role value cho filter
const roleValueMapping = {
  1: "Student",
  2: "Lecturer",
  3: "Admin",
};

const roleOptions = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "Student", label: "Sinh viên" },
  { value: "Lecturer", label: "Giảng viên" },
  { value: "Admin", label: "Quản trị viên" },
];

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState(roleOptions[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const pageSize = 8;
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch users từ API (server-side paging)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await userService.getUsers({
          page: currentPage,
          size: pageSize,
        });
        const content = response?.content || [];

        const transformedUsers = content.map((user) => ({
          userId: user.userId,
          name: user.fullName,
          username: user.username,
          email: user.username,
          roleIds: user.roleIds,
          status: user.status,
          avatar: `https://randomuser.me/api/portraits/${
            Math.random() > 0.5 ? "men" : "women"
          }/${Math.floor(Math.random() * 100)}.jpg`,
        }));

        setUsers(transformedUsers);
        if (typeof response?.totalElements === "number") {
          setTotalElements(response.totalElements);
        } else {
          setTotalElements(currentPage * pageSize + transformedUsers.length);
        }
        if (typeof response?.totalPages === "number") {
          setTotalPages(response.totalPages);
        } else {
          setTotalPages(
            transformedUsers.length < pageSize
              ? currentPage + 1
              : currentPage + 2
          );
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách users:", error);
        setError("Không thể tải danh sách người dùng");
        if (window.addToast) {
          window.addToast("Lỗi khi tải danh sách người dùng!", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage]);

  // Hàm helper để lấy role display từ roleIds
  const getRoleDisplay = (roleIds) => {
    if (!roleIds || roleIds.length === 0) return "Chưa phân quyền";

    const roleNames = roleIds
      .map((roleId) => roleMapping[roleId])
      .filter(Boolean);
    return roleNames.join(", ");
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
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === user.userId
            ? {
                ...u,
                name: payload.fullName,
                email: payload.username,
                roleIds: payload.roleIds,
              }
            : u
        )
      );
      if (window.addToast)
        window.addToast("Cập nhật người dùng thành công!", "success");
      cancelEdit();
    } catch (err) {
      console.error("Cập nhật người dùng thất bại:", err);
      if (window.addToast)
        window.addToast("Cập nhật người dùng thất bại!", "error");
    }
  };

  // Thay đổi trạng thái (Khóa/Mở khóa)
  const handleToggleLock = async (user) => {
    try {
      setStatusLoadingId(user.userId);
      const resp = await userService.changeStatusUser(user.userId);
      const returnedStatus = resp?.status;
      const nextStatus =
        typeof returnedStatus === "number"
          ? returnedStatus
          : user.status === 2
          ? 1
          : 2;
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === user.userId ? { ...u, status: nextStatus } : u
        )
      );
      if (window.addToast)
        window.addToast(
          "Cập nhật trạng thái người dùng thành công!",
          "success"
        );
    } catch (err) {
      console.error("Cập nhật trạng thái thất bại:", err);
      if (window.addToast)
        window.addToast("Cập nhật trạng thái thất bại!", "error");
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleAddUser = async (userData) => {
    console.log("Thêm người dùng mới:", userData);

    // Kiểm tra dữ liệu
    if (
      !userData.fullName ||
      !userData.username ||
      !userData.password ||
      !userData.roleIds
    ) {
      console.error("Dữ liệu không đầy đủ");
      if (window.addToast) {
        window.addToast("Dữ liệu không đầy đủ!", "error");
      }
      throw new Error("Dữ liệu không đầy đủ");
    }

    try {
      // Gọi API để tạo user
      const response = await userService.createUser(userData);
      console.log("API response:", response);

      // Refetch danh sách trang hiện tại để giữ đúng 8 bản ghi/trang
      const prevPage = currentPage;
      setCurrentPage(prevPage);

      // Hiển thị thông báo thành công ngay lập tức
      if (window.addToast) {
        window.addToast("Thêm người dùng thành công!", "success");
      }

      // Trả về kết quả để modal biết đã thành công
      return response;
    } catch (error) {
      console.error("Lỗi khi tạo user:", error);

      // Hiển thị thông báo lỗi
      if (window.addToast) {
        window.addToast("Lỗi khi thêm người dùng. Vui lòng thử lại!", "error");
      }

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
      // Refetch; nếu trang hiện tại rỗng sau khi xóa, lùi 1 trang
      if (users.length === 1 && currentPage > 0) {
        setCurrentPage((p) => p - 1);
      } else {
        setCurrentPage((p) => p);
      }
      if (window.addToast)
        window.addToast("Xóa người dùng thành công!", "success");
    } catch (err) {
      console.error("Xóa người dùng thất bại:", err);
      if (window.addToast) window.addToast("Xóa người dùng thất bại!", "error");
    } finally {
      setConfirmState({ open: false, userId: null, loading: false });
    }
  };

  if (loading) {
    return (
      <div className="user-management-container">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management-container">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p style={{ color: "red" }}>{error}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      {/* Toolbar */}
      <div className="user-management-toolbar">
        <div className="toolbar-left">
          <button className="add-user-btn" onClick={() => setIsModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Thêm người dùng
          </button>
          <div style={{ width: 140 }}>
            <Select
              classNamePrefix="role-select"
              value={selectedRole}
              onChange={setSelectedRole}
              options={roleOptions}
              isSearchable={false}
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: 8,
                  minHeight: 40,
                  fontSize: "0.95rem",
                  borderColor: "#d1d5db",
                  boxShadow: "none",
                  paddingLeft: 0,
                  width: 140,
                  minWidth: 0,
                  maxWidth: 140,
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
                  borderRadius: 8,
                  zIndex: 20,
                  width: 140,
                  minWidth: 0,
                  maxWidth: 140,
                }),
              }}
            />
          </div>
        </div>
        <div className="search-container">
          <i
            className="bi bi-search"
            style={{ color: "#6b7280", fontSize: "1rem" }}
          ></i>
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* User Table */}
      <div className="user-table-container">
        <table className="user-mgmt-table">
          <thead>
            <tr>
              <th>Họ và tên</th>
              <th>Vai trò</th>
              <th>Email</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.userId}>
                <td>
                  {editingUserId !== user.userId && (
                    <span className="user-mgmt-avatar-wrap">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="user-mgmt-avatar-sm"
                      />
                    </span>
                  )}
                  {editingUserId === user.userId ? (
                    <input
                      className="inline-input"
                      value={editDraft.fullName}
                      onChange={(e) =>
                        setEditDraft((d) => ({
                          ...d,
                          fullName: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <span className="user-mgmt-name">{user.name}</span>
                  )}
                </td>
                <td>
                  {editingUserId === user.userId ? (
                    <Select
                      classNamePrefix="inline-role-select"
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
                    getRoleDisplay(user.roleIds)
                  )}
                </td>
                <td>
                  {editingUserId === user.userId ? (
                    <input
                      className="inline-input"
                      value={editDraft.username}
                      onChange={(e) =>
                        setEditDraft((d) => ({
                          ...d,
                          username: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td>
                  <span
                    className={`user-status ${getStatusClass(user.status)}`}
                  >
                    <span className="user-status-dot"></span>
                    {getStatusLabel(user.status)}
                  </span>
                </td>
                <td>
                  {editingUserId === user.userId ? (
                    <span className="inline-actions">
                      <button
                        type="button"
                        className="user-mgmt-action inline-save"
                        title="Lưu"
                        aria-label="Lưu"
                        onClick={() => saveEdit(user)}
                      >
                        <i className="bi bi-check2"></i>
                      </button>
                      <button
                        type="button"
                        className="user-mgmt-action inline-cancel"
                        title="Hủy"
                        aria-label="Hủy"
                        onClick={cancelEdit}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="user-mgmt-action"
                        title="Chỉnh sửa"
                        aria-label="Chỉnh sửa"
                        onClick={() => startEdit(user)}
                      >
                        <i className="bi bi-pen"></i>
                      </button>
                      <button
                        type="button"
                        className="user-mgmt-action"
                        title="Xóa"
                        aria-label="Xóa người dùng"
                        onClick={() => handleDeleteUser(user.userId)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                      <button
                        type="button"
                        className={`user-mgmt-action ${
                          user.status === 2 ? "is-blocked-lock" : ""
                        }`}
                        title="Khóa"
                        aria-label="Khóa"
                        onClick={() => handleToggleLock(user)}
                      >
                        {statusLoadingId === user.userId ? (
                          <i className="bi bi-arrow-repeat spin"></i>
                        ) : (
                          <i className="bi bi-lock"></i>
                        )}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="table-footer">
        <div className="entries-info">
          Hiển thị {users.length ? currentPage * pageSize + 1 : 0} đến{" "}
          {currentPage * pageSize + users.length} trên {totalElements} bản ghi —
          Trang {currentPage + 1}/{totalPages}
        </div>
        <div className="pagination">
          <button
            className="pagination-btn prev-btn"
            disabled={currentPage === 0}
            onClick={() => currentPage > 0 && setCurrentPage(currentPage - 1)}
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <button className="pagination-btn active">{currentPage + 1}</button>
          <span style={{ margin: "0 8px", color: "#6b7280" }}>
            / {totalPages}
          </span>
          <button
            className="pagination-btn next-btn"
            disabled={currentPage + 1 >= totalPages || users.length < pageSize}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
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
      <ToastContainer />
    </div>
  );
};

export default UserManagement;
