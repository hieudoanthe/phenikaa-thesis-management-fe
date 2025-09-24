import React, { useState, useEffect, useMemo } from "react";
import registrationPeriodService from "../../services/registrationPeriod.service";
import { showToast } from "../../utils/toastHelper";
import ImportStudentsToPeriodModal from "../../components/modals/ImportStudentsToPeriodModal";
import ManageStudentsModal from "../../components/modals/ManageStudentsModal";

import academicYearService from "../../services/academicYear.service";
import importService from "../../services/import.service";
import Select from "react-select";

const RegistrationPeriodManagement = () => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState({
    value: "ALL",
    label: "Tất cả",
  });

  // Import and manage students modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [manageStudentsModalOpen, setManageStudentsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    periodName: "",
    academicYearId: "",
    startDate: "",
    endDate: "",
    maxStudentsPerLecturer: 15,
    description: "",
  });

  useEffect(() => {
    loadPeriods();
    loadActiveAcademicYear();
  }, []);

  const loadActiveAcademicYear = async () => {
    try {
      console.log("Đang gọi API lấy năm học active...");
      const result = await academicYearService.getActiveAcademicYear();
      console.log("Kết quả API năm học active:", result);

      if (result.success) {
        console.log("Năm học active data:", result.data);
        setActiveAcademicYear(result.data);
        // Tự động set academicYearId cho form
        setFormData((prev) => ({
          ...prev,
          academicYearId: result.data.academicYearId,
        }));
      } else {
        console.error("Không thể lấy năm học active:", result.message);
      }
    } catch (error) {
      console.error("Không thể lấy năm học active:", error);
    }
  };

  const loadPeriods = async () => {
    setLoading(true);
    try {
      const result = await registrationPeriodService.getAllPeriods();
      if (result.success) {
        setPeriods(result.data || []);
      }
    } catch (error) {
      showToast("Không thể tải danh sách đợt đăng ký");
    } finally {
      setLoading(false);
    }
  };

  const refreshPeriods = async () => {
    try {
      setRefreshing(true);
      const result = await registrationPeriodService.getAllPeriods();
      if (result.success) {
        setPeriods(result.data || []);
        showToast("Đã cập nhật danh sách đợt đăng ký", "success");
      } else {
        showToast(result.message);
      }
    } catch (error) {
      showToast("Lỗi khi tải danh sách đợt đăng ký");
      console.error("Lỗi:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation ngày
    const now = new Date();
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    // Kiểm tra ngày bắt đầu không được nhỏ hơn ngày hiện tại
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Đặt về đầu ngày
    if (startDate < today) {
      showToast("Ngày bắt đầu không được nhỏ hơn ngày hiện tại", "error");
      return;
    }

    // Kiểm tra ngày kết thúc phải lớn hơn ngày bắt đầu
    if (endDate <= startDate) {
      showToast("Ngày kết thúc phải lớn hơn ngày bắt đầu", "error");
      return;
    }

    // Kiểm tra ngày kết thúc có đúng là ngày bắt đầu + 10 ngày không (cho phép sai lệch 1 ngày)
    const expectedEndDate = new Date(startDate);
    expectedEndDate.setDate(expectedEndDate.getDate() + 10);
    const dayDifference =
      Math.abs(endDate - expectedEndDate) / (1000 * 60 * 60 * 24);

    if (dayDifference > 1) {
      showToast("Ngày kết thúc phải là ngày bắt đầu + 10 ngày", "error");
      return;
    }

    try {
      setSubmitting(true);
      console.log("Form data trước khi gửi:", formData);
      console.log("editingPeriod:", editingPeriod);

      const result = editingPeriod
        ? await registrationPeriodService.updatePeriod({
            ...formData,
            periodId: editingPeriod.periodId,
          })
        : await registrationPeriodService.createPeriod(formData);

      console.log("Kết quả API:", result);

      if (result.success) {
        showToast(result.message);
        setIsModalOpen(false);
        setEditingPeriod(null);
        resetForm();
        loadPeriods();
      } else {
        showToast(result.message);
      }
    } catch (error) {
      console.error("Lỗi trong handleSubmit:", error);
      showToast("Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartPeriod = async (periodId) => {
    try {
      // Kiểm tra số lượng sinh viên trước khi bắt đầu
      const studentsResp = await importService.getStudentsByPeriod(periodId);
      const studentCount =
        studentsResp?.success && Array.isArray(studentsResp.data)
          ? studentsResp.data.length
          : 0;
      if (studentCount === 0) {
        showToast(
          "Đợt đăng ký chưa có sinh viên. Vui lòng nhập sinh viên trước khi bắt đầu.",
          "warning"
        );
        return;
      }

      const result = await registrationPeriodService.startPeriod(periodId);
      if (result.success) {
        showToast(result.message);
        loadPeriods();
      } else {
        showToast(result.message);
      }
    } catch (error) {
      showToast("Có lỗi xảy ra");
    }
  };

  const handleClosePeriod = async (periodId) => {
    try {
      const result = await registrationPeriodService.closePeriod(periodId);
      if (result.success) {
        showToast(result.message);
        loadPeriods();
      } else {
        showToast(result.message);
      }
    } catch (error) {
      showToast("Có lỗi xảy ra");
    }
  };

  // Import students functions
  const handleImportStudents = (period) => {
    if (period?.status === "CLOSED") {
      showToast("Đợt đăng ký đã kết thúc, không thể nhập sinh viên", "warning");
      return;
    }
    setSelectedPeriod(period);
    setImportModalOpen(true);
  };

  const handleManageStudents = (period) => {
    setSelectedPeriod(period);
    setManageStudentsModalOpen(true);
  };

  const handleImportSuccess = () => {
    // Refresh periods list if needed
    loadPeriods();
  };

  const resetForm = () => {
    setFormData({
      periodName: "",
      academicYearId: activeAcademicYear?.academicYearId || "",
      startDate: "",
      endDate: "",
      maxStudentsPerLecturer: 15,
      description: "",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "UPCOMING":
        return "bg-blue-100 text-blue-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "ACTIVE":
        return "Đang hoạt động";
      case "UPCOMING":
        return "Sắp diễn ra";
      case "CLOSED":
        return "Đã kết thúc";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Pagination
  const filteredPeriods = useMemo(() => {
    if (!Array.isArray(periods)) return [];
    if (!statusFilter || statusFilter.value === "ALL") return periods;
    return periods.filter((p) => p.status === statusFilter.value);
  }, [periods, statusFilter]);

  const totalPages = Math.ceil(filteredPeriods.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredPeriods.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          <p>Đang tải danh sách đợt đăng ký...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 overflow-y-auto thin-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Status filter + Refresh */}
        <div className="w-full sm:w-auto flex items-center gap-3">
          <div className="w-60 sm:w-60 lg:w-60">
            <Select
              value={statusFilter}
              onChange={(opt) => {
                setCurrentPage(1);
                setStatusFilter(opt);
              }}
              options={[
                { value: "ALL", label: "Tất cả" },
                { value: "UPCOMING", label: "Chưa bắt đầu" },
                { value: "ACTIVE", label: "Đang diễn ra" },
                { value: "CLOSED", label: "Đã kết thúc" },
              ]}
              isSearchable={false}
              classNamePrefix="react-select"
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderRadius: 8,
                  minHeight: 40,
                  borderColor: state.isFocused ? "#ea580c" : base.borderColor,
                  boxShadow: state.isFocused
                    ? "0 0 0 3px rgba(234,88,12,0.15)"
                    : "none",
                  "&:hover": { borderColor: "#ea580c" },
                }),
                dropdownIndicator: (base, state) => ({
                  ...base,
                  color: state.isFocused ? "#ea580c" : base.color,
                  "&:hover": { color: "#ea580c" },
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? "#ea580c"
                    : state.isFocused
                    ? "#fff7ed"
                    : base.backgroundColor,
                  color: state.isSelected ? "#ffffff" : base.color,
                }),
              }}
            />
          </div>
          <button
            onClick={refreshPeriods}
            className="inline-flex items-center gap-2 h-10 px-4 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-400 border border-transparent transition-colors duration-200"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`${loading || refreshing ? "animate-spin" : ""}`}
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Làm mới
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-400 transition-colors duration-200 shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Tạo đợt đăng ký mới
          </button>
        </div>
      </div>

      {/* Thông tin năm học hiện tại */}
      {activeAcademicYear && (
        <div className="bg-[#273C62] rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-400 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <div className="text-sm text-gray-300 mb-1">Năm học hiện tại</div>
              <div className="text-xl font-bold text-white">
                {activeAcademicYear.yearName}
              </div>
            </div>
          </div>
        </div>
      )}

      {!activeAcademicYear && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-600 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">
                Chưa có năm học nào được kích hoạt
              </h3>
              <p className="text-yellow-700">
                Vui lòng kích hoạt một năm học trước khi tạo đợt đăng ký
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách đợt đăng ký */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 m-0">
            Danh sách đợt đăng ký
          </h2>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {currentItems.map((period) => (
            <div
              key={period.periodId}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold text-gray-900 truncate">
                    {period.periodName}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    <div>Bắt đầu: {formatDateTime(period.startDate)}</div>
                    <div>Kết thúc: {formatDateTime(period.endDate)}</div>
                    <div>
                      Sức chứa: {period.maxStudentsPerLecturer} sinh viên/GV
                    </div>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md ${getStatusColor(
                        period.status
                      )}`}
                    >
                      {getStatusText(period.status)}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col gap-2">
                  {period.status === "UPCOMING" && (
                    <button
                      onClick={() => handleStartPeriod(period.periodId)}
                      className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      Bắt đầu
                    </button>
                  )}
                  {period.status === "ACTIVE" && (
                    <button
                      onClick={() => handleClosePeriod(period.periodId)}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Kết thúc
                    </button>
                  )}

                  {/* Import and manage buttons for mobile */}
                  <button
                    onClick={() => handleImportStudents(period)}
                    disabled={period.status === "CLOSED"}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                      period.status === "CLOSED"
                        ? "text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed"
                        : "text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100"
                    }`}
                  >
                    Nhập SV
                  </button>
                  <button
                    onClick={() => handleManageStudents(period)}
                    className="px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
                  >
                    Quản lý SV
                  </button>
                </div>
              </div>
              {period.description && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600">{period.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên đợt
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sức chứa/GV
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((period) => (
                <tr key={period.periodId}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {period.periodName}
                    </div>
                    {period.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {period.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(period.startDate)} -{" "}
                      {formatDate(period.endDate)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDateTime(period.startDate)} -{" "}
                      {formatDateTime(period.endDate)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {period.maxStudentsPerLecturer} sinh viên
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md ${getStatusColor(
                        period.status
                      )}`}
                    >
                      {getStatusText(period.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2 flex-wrap">
                      {period.status === "UPCOMING" && (
                        <button
                          onClick={() => handleStartPeriod(period.periodId)}
                          className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          Bắt đầu
                        </button>
                      )}
                      {period.status === "ACTIVE" && (
                        <button
                          onClick={() => handleClosePeriod(period.periodId)}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Kết thúc
                        </button>
                      )}

                      {/* Import students button */}
                      <button
                        onClick={() => handleImportStudents(period)}
                        disabled={period.status === "CLOSED"}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                          period.status === "CLOSED"
                            ? "text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed"
                            : "text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100"
                        }`}
                        title="Nhập danh sách sinh viên từ CSV"
                      >
                        <svg
                          className="w-3 h-3 inline mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                          />
                        </svg>
                        Nhập
                      </button>

                      {/* Manage students button */}
                      <button
                        onClick={() => handleManageStudents(period)}
                        className="px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
                        title="Quản lý sinh viên"
                      >
                        Quản lý
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-600">
              Tổng {periods.length} đợt đăng ký
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
        )}
      </div>

      {/* Modal tạo/chỉnh sửa đợt đăng ký */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setIsModalOpen(false);
            setEditingPeriod(null);
            resetForm();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsModalOpen(false);
              setEditingPeriod(null);
              resetForm();
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
                {editingPeriod
                  ? "Chỉnh sửa đợt đăng ký"
                  : "Tạo đợt đăng ký mới"}
              </h2>
            </div>

            {/* Form */}
            <form className="p-6 space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-5">
                  <div className="relative">
                    <input
                      id="periodName"
                      type="text"
                      placeholder=" "
                      value={formData.periodName}
                      onChange={(e) =>
                        setFormData({ ...formData, periodName: e.target.value })
                      }
                      required
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-lg bg-white peer"
                    />
                    <label
                      htmlFor="periodName"
                      className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
                    >
                      Tên đợt đăng ký <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      id="maxStudents"
                      type="number"
                      placeholder=" "
                      value={formData.maxStudentsPerLecturer}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxStudentsPerLecturer: parseInt(e.target.value),
                        })
                      }
                      min="1"
                      max="50"
                      required
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-lg bg-white peer"
                    />
                    <label
                      htmlFor="maxStudents"
                      className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
                    >
                      Sức chứa tối đa/GV <span className="text-red-500">*</span>
                    </label>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  <div className="relative">
                    <input
                      id="startDate"
                      type="datetime-local"
                      placeholder=" "
                      value={formData.startDate}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        if (startDate) {
                          // Tự động set ngày kết thúc = ngày bắt đầu + 10 ngày
                          const startDateObj = new Date(startDate);
                          const endDateObj = new Date(startDateObj);
                          endDateObj.setDate(endDateObj.getDate() + 10);

                          // Format lại thành datetime-local format
                          const endDateStr = endDateObj
                            .toISOString()
                            .slice(0, 16);

                          setFormData({
                            ...formData,
                            startDate: startDate,
                            endDate: endDateStr,
                          });
                        } else {
                          setFormData({ ...formData, startDate: startDate });
                        }
                      }}
                      min={new Date().toISOString().slice(0, 10) + "T00:00"}
                      required
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-lg bg-white peer"
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
                      id="endDate"
                      type="datetime-local"
                      placeholder=" "
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      min={
                        formData.startDate ||
                        new Date().toISOString().slice(0, 16)
                      }
                      required
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-lg bg-white peer"
                    />
                    <label
                      htmlFor="endDate"
                      className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
                    >
                      Ngày kết thúc <span className="text-red-500">*</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="relative">
                <textarea
                  id="description"
                  placeholder=" "
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-lg bg-white peer resize-none"
                />
                <label
                  htmlFor="description"
                  className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
                >
                  Mô tả (tùy chọn)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPeriod(null);
                    resetForm();
                  }}
                  className="px-6 py-2.5 text-base font-medium text-gray-600 bg-gray-100 rounded-lg border-none cursor-pointer transition-all duration-200 hover:bg-gray-200 hover:text-gray-700 min-w-[100px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2.5 text-base font-medium text-white rounded-lg border-none cursor-pointer transition-all duration-200 min-w-[140px] ${
                    submitting
                      ? "bg-primary-300 cursor-not-allowed"
                      : "bg-primary-500 hover:bg-primary-400"
                  }`}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <svg
                        className="w-4 h-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" />
                        <path className="opacity-75" d="M4 12a8 8 0 018-8" />
                      </svg>
                      Đang lưu...
                    </span>
                  ) : (
                    <>{editingPeriod ? "Cập nhật" : "Tạo đợt đăng ký"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Students Modal */}
      <ImportStudentsToPeriodModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        periodId={selectedPeriod?.periodId}
        periodName={selectedPeriod?.periodName}
        academicYearId={
          selectedPeriod?.academicYearId || activeAcademicYear?.academicYearId
        }
        onImportSuccess={handleImportSuccess}
      />

      {/* Manage Students Modal */}
      <ManageStudentsModal
        isOpen={manageStudentsModalOpen}
        onClose={() => setManageStudentsModalOpen(false)}
        periodId={selectedPeriod?.periodId}
        periodName={selectedPeriod?.periodName}
        periodStatus={selectedPeriod?.status}
      />
    </div>
  );
};

export default RegistrationPeriodManagement;
