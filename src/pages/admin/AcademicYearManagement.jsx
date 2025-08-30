import React, { useState, useEffect } from "react";
import "../../styles/common/design-tokens.css";
import "../../styles/pages/admin/academic_year_management.css";
import academicYearService from "../../services/academicYear.service";
import { toast } from "react-toastify";

const AcademicYearManagement = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [currentYear, setCurrentYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadAcademicYears();
  }, []);

  const loadAcademicYears = async () => {
    try {
      setLoading(true);
      const result = await academicYearService.getAllAcademicYears();
      if (result.success) {
        console.log("Academic years data:", result.data); // Debug log
        setAcademicYears(result.data || []);

        // Tìm năm học đang active
        const activeYear = result.data.find((year) => (year.status || 0) === 1);
        setCurrentYear(activeYear);
      } else {
        toast.error(result.message || "Không thể tải danh sách năm học");
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách năm học:", error);
      toast.error("Lỗi khi tải danh sách năm học!");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (yearId, newStatus) => {
    try {
      if (newStatus === "active") {
        const result = await academicYearService.activateAcademicYear(yearId);
        if (result.success) {
          toast.success("Đã kích hoạt năm học thành công!");
          loadAcademicYears(); // Reload để cập nhật trạng thái
        } else {
          toast.error(result.message || "Không thể kích hoạt năm học");
        }
      } else {
        // TODO: Implement deactivate nếu cần
        toast.info("Chức năng vô hiệu hóa năm học sẽ được thêm sau");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      toast.error("Lỗi khi cập nhật trạng thái!");
    }
  };

  const handleEdit = (year) => {
    setEditingYear(year);
    setIsModalOpen(true);
  };

  const handleDelete = async (yearId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa năm học này?")) {
      try {
        // TODO: Gọi API để xóa
        setAcademicYears((prev) =>
          prev.filter((year) => year.academicYearId !== yearId)
        );

        if (window.addToast) {
          window.addToast("Đã xóa năm học thành công!", "success");
        }
      } catch (error) {
        console.error("Lỗi khi xóa năm học:", error);
        if (window.addToast) {
          window.addToast("Lỗi khi xóa năm học!", "error");
        }
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 1:
        return "Active";
      case 0:
        return "Inactive";
      case 2:
        return "Upcoming";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 1:
        return "#10B981";
      case 0:
        return "#6B7280";
      case 2:
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  // Tính toán phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = academicYears.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(academicYears.length / itemsPerPage);

  if (loading) {
    return (
      <div className="academic-year-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="academic-year-management">
      {/* Thẻ năm học hiện tại */}
      {currentYear && (
        <div className="current-year-card">
          <div className="current-year-info">
            <div className="current-year-label">Current Academic Year</div>
            <div className="current-year-name">{currentYear.yearName}</div>
            <div className="current-year-status">
              <span className="status-dot active"></span>
              Active
            </div>
          </div>
          <div className="current-year-period">
            {currentYear.startDate ? formatDate(currentYear.startDate) : "N/A"}{" "}
            - {currentYear.endDate ? formatDate(currentYear.endDate) : "N/A"}
          </div>
        </div>
      )}

      {/* Bảng danh sách năm học */}
      <div className="academic-year-table-container">
        <div className="table-header">
          <h2>Danh sách năm học</h2>
          <button className="add-year-btn" onClick={() => setIsModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Thêm năm học
          </button>
        </div>

        <div className="table-wrapper">
          <table className="academic-year-table">
            <thead>
              <tr>
                <th>Year Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems
                .filter((year) => year && year.academicYearId) // Sử dụng academicYearId
                .map((year) => (
                  <tr
                    key={year.academicYearId}
                    className={
                      (year.status || 0) === 1 ? "current-year-row" : ""
                    }
                  >
                    <td className="year-name">{year.yearName}</td>
                    <td>
                      {year.startDate ? formatDate(year.startDate) : "N/A"}
                    </td>
                    <td>{year.endDate ? formatDate(year.endDate) : "N/A"}</td>
                    <td>
                      <div className="status-toggle">
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={(year.status || 0) === 1}
                            onChange={(e) =>
                              handleStatusToggle(
                                year.academicYearId,
                                e.target.checked ? "active" : "inactive"
                              )
                            }
                          />
                          <span
                            className="slider"
                            style={{
                              backgroundColor: getStatusColor(year.status || 0),
                            }}
                          ></span>
                        </label>
                        <span className="status-text">
                          {getStatusText(year.status || 0)}
                        </span>
                      </div>
                    </td>
                    <td>
                      {year.createdAt ? formatDate(year.createdAt) : "N/A"}
                    </td>
                    <td className="actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(year)}
                        title="Chỉnh sửa"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(year.academicYearId)}
                        title="Xóa"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, academicYears.length)} of{" "}
            {academicYears.length} entries
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              &lt; Previous
            </button>
            <button className="pagination-btn active" disabled>
              {currentPage}
            </button>
            <button
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Modal thêm/chỉnh sửa năm học */}
      {isModalOpen && (
        <AcademicYearModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingYear(null);
          }}
          editingYear={editingYear}
          onSave={(yearData) => {
            // TODO: Xử lý lưu năm học
            setIsModalOpen(false);
            setEditingYear(null);
            loadAcademicYears();
          }}
        />
      )}
    </div>
  );
};

// Component Modal
const AcademicYearModal = ({ isOpen, onClose, editingYear, onSave }) => {
  const [formData, setFormData] = useState({
    yearName: "",
    startDate: "",
    endDate: "",
    status: "active",
  });

  useEffect(() => {
    if (editingYear) {
      setFormData({
        yearName: editingYear.yearName || "",
        startDate: editingYear.startDate
          ? editingYear.startDate.split("T")[0]
          : "",
        endDate: editingYear.endDate ? editingYear.endDate.split("T")[0] : "",
        status: editingYear.status === 1 ? "active" : "inactive",
      });
    } else {
      setFormData({
        yearName: "",
        startDate: "",
        endDate: "",
        status: "active",
      });
    }
  }, [editingYear]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingYear ? "Chỉnh sửa năm học" : "Thêm năm học mới"}</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <div className="floating-input-group">
              <input
                type="text"
                id="yearName"
                value={formData.yearName}
                onChange={(e) =>
                  setFormData({ ...formData, yearName: e.target.value })
                }
                placeholder=" "
                required
              />
              <label htmlFor="yearName" className="floating-label">
                Tên năm học
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <div className="floating-input-group">
                <input
                  type="date"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  placeholder=" "
                  required
                />
                <label htmlFor="startDate" className="floating-label">
                  Ngày bắt đầu
                </label>
              </div>
            </div>

            <div className="form-group">
              <div className="floating-input-group">
                <input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  placeholder=" "
                  required
                />
                <label htmlFor="endDate" className="floating-label">
                  Ngày kết thúc
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="floating-input-group">
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <label htmlFor="status" className="floating-label">
                Trạng thái
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {editingYear ? "Cập nhật" : "Thêm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcademicYearManagement;
