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

const statusClass = {
  "Hoạt động": "user-status active",
  "Không hoạt động": "user-status inactive",
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

  // Fetch users từ API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await userService.getUsers();
        console.log("API response:", response);

        // Transform data từ API sang format hiển thị
        const transformedUsers = response.map((user) => ({
          userId: user.userId,
          name: user.fullName,
          username: user.username,
          email: user.username,
          roleIds: user.roleIds,
          status: user.status === 1 ? "Hoạt động" : "Không hoạt động",
          avatar: `https://randomuser.me/api/portraits/${
            Math.random() > 0.5 ? "men" : "women"
          }/${Math.floor(Math.random() * 100)}.jpg`,
        }));

        setUsers(transformedUsers);
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
  }, []);

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

  const getOptionBackgroundColor = (state) => {
    if (state.isSelected) return "#2563eb";
    if (state.isFocused) return "#f3f4f6";
    return "#fff";
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

      // Tạo user object mới cho UI
      const newUser = {
        userId: response.userId || Date.now(), // Fallback nếu API không trả về userId
        name: userData.fullName,
        username: userData.username,
        email: userData.username,
        roleIds: userData.roleIds,
        status: "Hoạt động",
        avatar: `https://randomuser.me/api/portraits/${
          Math.random() > 0.5 ? "men" : "women"
        }/${Math.floor(Math.random() * 100)}.jpg`,
      };

      console.log("User object mới:", newUser);

      // Thêm vào danh sách users
      setUsers((prevUsers) => [...prevUsers, newUser]);

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
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
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
                  <span className="user-mgmt-avatar-wrap">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="user-mgmt-avatar-sm"
                    />
                  </span>
                  <span className="user-mgmt-name">{user.name}</span>
                </td>
                <td>{getRoleDisplay(user.roleIds)}</td>
                <td>{user.email}</td>
                <td>
                  <span
                    className={`user-status ${
                      user.status === "Hoạt động" ? "active" : "inactive"
                    }`}
                  >
                    <span className="user-status-dot"></span>
                    {user.status}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="user-mgmt-action"
                    title="Chỉnh sửa"
                    aria-label="Chỉnh sửa"
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
                    className="user-mgmt-action"
                    title="Khóa"
                    aria-label="Khóa"
                  >
                    <i className="bi bi-lock"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="table-footer">
        <div className="entries-info">
          Hiển thị 1 đến {filteredUsers.length} trên {users.length} bản ghi
        </div>
        <div className="pagination">
          <button className="pagination-btn prev-btn" disabled>
            <i className="bi bi-chevron-left"></i>
          </button>
          <button className="pagination-btn active">1</button>
          <button className="pagination-btn next-btn" disabled>
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
