import React, { useState, useEffect } from "react";
import registrationPeriodService from "../../services/registrationPeriod.service";
import { toast } from "react-toastify";

// Helper hiển thị toast sử dụng react-toastify
const showToast = (message, type = "success") => {
  try {
    if (type === "error") return showToast(message);
    if (type === "warning") return toast.warn(message);
    if (type === "info") return toast.info(message);
    return showToast(message);
  } catch (err) {
    console.error("Không thể hiển thị toast:", err);
    (type === "success" ? console.log : console.error)(message);
  }
};
import { API_ENDPOINTS } from "../../config/api";
import academicYearService from "../../services/academicYear.service";

const RegistrationPeriodManagement = () => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Form data trước khi gửi:", formData); // Debug log
      console.log("editingPeriod:", editingPeriod); // Debug log

      const result = editingPeriod
        ? await registrationPeriodService.updatePeriod({
            ...formData,
            periodId: editingPeriod.periodId,
          })
        : await registrationPeriodService.createPeriod(formData);

      console.log("Kết quả API:", result); // Debug log

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
      console.error("Lỗi trong handleSubmit:", error); // Debug log
      showToast("Có lỗi xảy ra");
    }
  };

  const handleStartPeriod = async (periodId) => {
    try {
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

  return (
    <div className="registration-period-management p-6">
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#ea580c] hover:brightness-95 text-white px-4 py-2 rounded-lg"
        >
          Tạo đợt đăng ký mới
        </button>
      </div>

      {/* Hiển thị thông tin năm học active */}
      {activeAcademicYear && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-600 mr-2"
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
              <h3 className="text-lg font-semibold text-green-800">
                Năm học hiện tại: {activeAcademicYear.yearName}
              </h3>
            </div>
          </div>
        </div>
      )}

      {!activeAcademicYear && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
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
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên đợt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sức chứa/GV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {periods.map((period) => (
                <tr key={period.periodId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {period.periodName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(period.startDate).toLocaleDateString("vi-VN")} -{" "}
                      {new Date(period.endDate).toLocaleDateString("vi-VN")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {period.maxStudentsPerLecturer} sinh viên
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md ${getStatusColor(
                        period.status
                      )}`}
                    >
                      {getStatusText(period.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {period.status === "UPCOMING" && (
                      <button
                        onClick={() => handleStartPeriod(period.periodId)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Bắt đầu
                      </button>
                    )}
                    {period.status === "ACTIVE" && (
                      <button
                        onClick={() => handleClosePeriod(period.periodId)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Kết thúc
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal tạo/chỉnh sửa đợt đăng ký */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingPeriod ? "Chỉnh sửa đợt đăng ký" : "Tạo đợt đăng ký mới"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên đợt đăng ký
                </label>
                <input
                  type="text"
                  value={formData.periodName}
                  onChange={(e) =>
                    setFormData({ ...formData, periodName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sức chứa tối đa/GV
                </label>
                <input
                  type="number"
                  value={formData.maxStudentsPerLecturer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxStudentsPerLecturer: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="1"
                  max="50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày kết thúc
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Mô tả về đợt đăng ký này..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPeriod(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingPeriod ? "Cập nhật" : "Tạo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationPeriodManagement;
