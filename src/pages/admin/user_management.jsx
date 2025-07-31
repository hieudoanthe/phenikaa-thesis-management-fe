import React, { useState } from "react";
import Select from "react-select";
import AddUserModal from "../../components/modals/add_user_modal";
import { ToastContainer } from "../../components/common";
import { userService } from "../../services";
import "../../styles/pages/admin/user_management.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const users = [
  {
    name: "Sarah Johnson",
    role: "Student",
    email: "sarah.j@university.edu",
    status: "Hoạt động",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Dr. Michael Chen",
    role: "Lecturer",
    email: "m.chen@university.edu",
    status: "Hoạt động",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Prof. Emily Brown",
    role: "Admin",
    email: "e.brown@university.edu",
    status: "Hoạt động",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    name: "James Wilson",
    role: "Student",
    email: "j.wilson@university.edu",
    status: "Không hoạt động",
    avatar: "https://randomuser.me/api/portraits/men/41.jpg",
  },
  {
    name: "Dr. Lisa Anderson",
    role: "Lecturer",
    email: "l.anderson@university.edu",
    status: "Hoạt động",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

const statusClass = {
  "Hoạt động": "user-status active",
  "Không hoạt động": "user-status inactive",
};

const roleOptions = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "Student", label: "Sinh viên" },
  { value: "Lecturer", label: "Giảng viên" },
  { value: "Admin", label: "Admin" },
];

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState(roleOptions[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      selectedRole.value === "all" || user.role === selectedRole.value;
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
        name: userData.fullName,
        username: userData.username,
        email: userData.username, // Giả sử username là email
        role: userData.roles.join(", "), // Hiển thị tất cả roles
        status: "Hoạt động",
        avatar: `https://randomuser.me/api/portraits/${
          Math.random() > 0.5 ? "men" : "women"
        }/${Math.floor(Math.random() * 100)}.jpg`,
      };

      console.log("User object mới:", newUser);

      // Thêm vào danh sách users (trong thực tế sẽ gọi API)
      users.push(newUser);

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
              <tr key={user.email}>
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
                <td>{user.role}</td>
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
                  <span className="user-mgmt-action" title="Edit">
                    <i className="bi bi-pen"></i>
                  </span>
                  <span className="user-mgmt-action" title="Delete">
                    <i className="bi bi-trash"></i>
                  </span>
                  <span className="user-mgmt-action" title="Lock">
                    <i className="bi bi-lock"></i>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="table-footer">
        <div className="entries-info">
          Hiển thị 1 đến {filteredUsers.length} trên {filteredUsers.length}
          bản ghi
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

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default UserManagement;
