import React from "react";
import AdminLayout from "../../components/layout/admin_layout";
import "../../styles/pages/admin/style.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const users = [
  {
    name: "Sarah Johnson",
    role: "Student",
    email: "sarah.j@university.edu",
    status: "Active",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Dr. Michael Chen",
    role: "Lecturer",
    email: "m.chen@university.edu",
    status: "Active",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Prof. Emily Brown",
    role: "Admin",
    email: "e.brown@university.edu",
    status: "Active",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    name: "James Wilson",
    role: "Student",
    email: "j.wilson@university.edu",
    status: "Inactive",
    avatar: "https://randomuser.me/api/portraits/men/41.jpg",
  },
  {
    name: "Dr. Lisa Anderson",
    role: "Lecturer",
    email: "l.anderson@university.edu",
    status: "Active",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

const statusClass = {
  Active: "user-status active",
  Inactive: "user-status inactive",
};

const UserManagement = () => (
  <AdminLayout welcomeText="User Management">
    <div className="user-mgmt-card">
      <div className="user-mgmt-toolbar">
        <button className="user-mgmt-add-btn">+ Add User</button>
        <select className="user-mgmt-role-filter">
          <option>All Roles</option>
          <option>Student</option>
          <option>Lecturer</option>
          <option>Admin</option>
        </select>
        <div className="user-mgmt-search-box">
          <input placeholder="Search users..." />
        </div>
      </div>
      <table className="user-mgmt-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Role</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.email}>
              <td>
                <span className="user-mgmt-avatar-wrap">
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="user-mgmt-avatar-sm"
                  />
                </span>
                <span className="user-mgmt-name">{u.name}</span>
              </td>
              <td>{u.role}</td>
              <td>{u.email}</td>
              <td>
                <span className={statusClass[u.status]}>
                  <span className="user-status-dot"></span>
                  {u.status}
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
      <div className="user-mgmt-footer-row">
        <span>Showing 1 to 5 of 5 entries</span>
        <div className="user-mgmt-pagination">
          <button className="user-mgmt-page-btn active">1</button>
        </div>
      </div>
    </div>
  </AdminLayout>
);

export default UserManagement;
