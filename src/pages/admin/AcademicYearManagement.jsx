import React, { useState, useEffect } from "react";
import academicYearService from "../../services/academicYear.service";
import { showToast } from "../../utils/toastHelper";
import { useTranslation } from "react-i18next";

const AcademicYearManagement = () => {
  const { t } = useTranslation();
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
        showToast(result.message || t("admin.academicYear.errorLoading"));
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách năm học:", error);
      showToast(t("admin.academicYear.errorLoadingMessage"));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (yearId, newStatus) => {
    try {
      if (newStatus === "active") {
        const result = await academicYearService.activateAcademicYear(yearId);
        if (result.success) {
          showToast(t("admin.academicYear.activateSuccess"));
          loadAcademicYears(); // Reload để cập nhật trạng thái
        } else {
          showToast(result.message || t("admin.academicYear.activateError"));
        }
      } else {
        // TODO: Implement deactivate nếu cần
        showToast("Chức năng vô hiệu hóa năm học sẽ được thêm sau");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      showToast("Lỗi khi cập nhật trạng thái!");
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
        return "Hoạt động";
      case 0:
        return "Không hoạt động";
      case 2:
        return "Sắp tới";
      default:
        return "Không rõ";
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
      <div className="bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          <p>Đang tải danh sách năm học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Thẻ năm học hiện tại */}
      {currentYear && (
        <div className="bg-[#273C62] rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-sm text-gray-300 mb-2">Năm học hiện tại</div>
              <div className="text-2xl font-bold text-white mb-2">
                {currentYear.yearName}
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-gray-300">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                Hoạt động
              </div>
            </div>
            <div className="text-sm text-gray-300">
              {currentYear.startDate
                ? formatDate(currentYear.startDate)
                : "N/A"}
              <span className="mx-2">-</span>
              {currentYear.endDate ? formatDate(currentYear.endDate) : "N/A"}
            </div>
          </div>
        </div>
      )}

      {/* Bảng danh sách năm học */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 m-0">
            Danh sách năm học
          </h2>
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-400 transition-colors duration-200 shadow-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Thêm năm học
          </button>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {currentItems
            .filter((year) => year && year.academicYearId)
            .map((year) => (
              <div
                key={year.academicYearId}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-gray-900 truncate">
                      {year.yearName}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      <div>
                        Bắt đầu:{" "}
                        {year.startDate ? formatDate(year.startDate) : "N/A"}
                      </div>
                      <div>
                        Kết thúc:{" "}
                        {year.endDate ? formatDate(year.endDate) : "N/A"}
                      </div>
                    </div>
                    <div className="mt-1 inline-flex items-center gap-2 text-sm">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          (year.status || 0) === 1
                            ? "bg-green-500"
                            : (year.status || 0) === 2
                            ? "bg-blue-500"
                            : "bg-gray-400"
                        }`}
                      ></span>
                      {getStatusText(year.status || 0)}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      className="p-2 text-info-500 hover:bg-info-50 rounded-lg"
                      onClick={() => handleEdit(year)}
                      title="Chỉnh sửa"
                    >
                      <i className="bi bi-pen"></i>
                    </button>
                    <button
                      className="p-2 text-error-500 hover:bg-error-50 rounded-lg"
                      onClick={() => handleDelete(year.academicYearId)}
                      title="Xóa"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
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
                    <span>Kích hoạt</span>
                  </label>
                </div>
              </div>
            ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <style>
            {`
              table th::after,
              table th::before {
                display: none !important;
              }
              table th {
                position: relative;
              }
              table th:not(:last-child)::after {
                content: '';
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 0;
                height: 0;
                border: none;
                display: none !important;
              }
            `}
          </style>
          <table
            className="min-w-full divide-y divide-gray-200"
            style={{ borderCollapse: "separate", borderSpacing: 0 }}
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên năm học
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày bắt đầu
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày kết thúc
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems
                .filter((year) => year && year.academicYearId) // Sử dụng academicYearId
                .map((year) => (
                  <tr
                    key={year.academicYearId}
                    className={
                      (year.status || 0) === 1
                        ? "bg-blue-50 border-l-4 border-l-primary-500"
                        : ""
                    }
                  >
                    <td className="font-semibold text-gray-900 border-l border-gray-200 pl-4">
                      {year.yearName}
                    </td>
                    <td>
                      {year.startDate ? formatDate(year.startDate) : "N/A"}
                    </td>
                    <td>{year.endDate ? formatDate(year.endDate) : "N/A"}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-primary-500 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                            checked={(year.status || 0) === 1}
                            onChange={(e) =>
                              handleStatusToggle(
                                year.academicYearId,
                                e.target.checked ? "active" : "inactive"
                              )
                            }
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {getStatusText(year.status || 0)}
                          </span>
                        </label>
                      </div>
                    </td>
                    <td>
                      {year.createdAt ? formatDate(year.createdAt) : "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-info-500 hover:bg-info-50 rounded-lg"
                          onClick={() => handleEdit(year)}
                          title="Chỉnh sửa"
                          aria-label="Chỉnh sửa"
                        >
                          <i className="bi bi-pen"></i>
                        </button>
                        <button
                          className="p-2 text-error-500 hover:bg-error-50 rounded-lg"
                          onClick={() => handleDelete(year.academicYearId)}
                          title="Xóa"
                          aria-label="Xóa"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            Tổng {academicYears.length} năm học
          </div>
          <div className="inline-flex items-center bg-white border border-gray-200 rounded-[14px] overflow-hidden shadow-sm self-center sm:self-auto">
            <button
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              Đầu
            </button>
            <button
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              aria-label="Trang trước"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <span className="px-3 py-2 text-sm bg-accent-500 text-white">
              {currentPage}
            </span>
            <button
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              aria-label="Trang sau"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
            <button
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              Cuối
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900 m-0">
            {editingYear ? "Chỉnh sửa năm học" : "Thêm năm học mới"}
          </h2>
        </div>

        {/* Form */}
        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              <div className="relative">
                <input
                  id="yearName"
                  type="text"
                  placeholder=" "
                  value={formData.yearName}
                  onChange={(e) =>
                    setFormData({ ...formData, yearName: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-lg bg-white peer"
                />
                <label
                  htmlFor="yearName"
                  className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
                >
                  Tên năm học <span className="text-red-500">*</span>
                </label>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div className="relative">
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-lg bg-white peer"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
                <label
                  htmlFor="status"
                  className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
                >
                  Trạng thái
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-lg bg-white peer"
                placeholder=" "
                required
              />
              <label
                htmlFor="startDate"
                className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
              >
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
            </div>

            <div className="relative">
              <input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-lg bg-white peer"
                placeholder=" "
                required
              />
              <label
                htmlFor="endDate"
                className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
              >
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-base font-medium text-gray-600 bg-gray-100 rounded-lg border-none cursor-pointer transition-all duration-200 hover:bg-gray-200 hover:text-gray-700 min-w-[100px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-base font-medium text-white bg-primary-500 rounded-lg border-none cursor-pointer transition-all duration-200 hover:bg-primary-400 min-w-[120px]"
            >
              {editingYear ? "Cập nhật" : "Thêm năm học"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcademicYearManagement;
