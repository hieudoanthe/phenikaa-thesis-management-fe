import React, { useState, useEffect } from "react";
import { evalService } from "../../services/evalService";
import { toast } from "react-toastify";

const DefenseScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    scheduleName: "",
    academicYearId: "",
    startDate: "",
    endDate: "",
    location: "",
    description: "",
    createdBy: 1, // TODO: Lấy từ user context
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await evalService.getAllDefenseSchedules();
      setSchedules(data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách lịch bảo vệ");
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    setFormData({
      scheduleName: "",
      academicYearId: "",
      startDate: "",
      endDate: "",
      location: "",
      description: "",
      createdBy: 1,
    });
    setIsModalOpen(true);
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      scheduleName: schedule.scheduleName || "",
      academicYearId: schedule.academicYearId || "",
      startDate: schedule.startDate ? schedule.startDate.split("T")[0] : "",
      endDate: schedule.endDate ? schedule.endDate.split("T")[0] : "",
      location: schedule.location || "",
      description: schedule.description || "",
      createdBy: schedule.createdBy || 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingSchedule) {
        await evalService.updateDefenseSchedule(
          editingSchedule.scheduleId,
          formData
        );
        toast.success("Cập nhật lịch bảo vệ thành công");
      } else {
        await evalService.createDefenseSchedule(formData);
        toast.success("Tạo lịch bảo vệ thành công");
      }

      setIsModalOpen(false);
      loadSchedules();
    } catch (error) {
      toast.error("Lỗi khi lưu lịch bảo vệ");
      console.error("Lỗi:", error);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lịch bảo vệ này?")) {
      try {
        await evalService.deleteDefenseSchedule(scheduleId);
        toast.success("Xóa lịch bảo vệ thành công");
        loadSchedules();
      } catch (error) {
        toast.error("Lỗi khi xóa lịch bảo vệ");
        console.error("Lỗi:", error);
      }
    }
  };

  const handleActivateSchedule = async (scheduleId) => {
    try {
      await evalService.activateDefenseSchedule(scheduleId);
      toast.success("Kích hoạt lịch bảo vệ thành công");
      loadSchedules();
    } catch (error) {
      toast.error("Lỗi khi kích hoạt lịch bảo vệ");
      console.error("Lỗi:", error);
    }
  };

  const handleDeactivateSchedule = async (scheduleId) => {
    try {
      await evalService.deactivateDefenseSchedule(scheduleId);
      toast.success("Hủy kích hoạt lịch bảo vệ thành công");
      loadSchedules();
    } catch (error) {
      toast.error("Lỗi khi hủy kích hoạt lịch bảo vệ");
      console.error("Lỗi:", error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PLANNING: {
        color: "bg-blue-100 text-blue-800",
        text: "Đang lập kế hoạch",
      },
      ACTIVE: { color: "bg-green-100 text-green-800", text: "Đang hoạt động" },
      COMPLETED: { color: "bg-gray-100 text-gray-800", text: "Đã hoàn thành" },
      CANCELLED: { color: "bg-red-100 text-red-800", text: "Đã hủy" },
    };

    const config = statusConfig[status] || statusConfig["PLANNING"];

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Quản lý lịch bảo vệ
          </h1>
          <p className="mt-2 text-gray-600">
            Quản lý các lịch bảo vệ đề tài tốt nghiệp
          </p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={handleCreateSchedule}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Tạo lịch bảo vệ</span>
            </button>
          </div>
        </div>

        {/* Schedules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <div
              key={schedule.scheduleId}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {schedule.scheduleName}
                  </h3>
                  {getStatusBadge(schedule.status)}
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {schedule.startDate
                        ? new Date(schedule.startDate).toLocaleDateString(
                            "vi-VN"
                          )
                        : "N/A"}{" "}
                      -
                      {schedule.endDate
                        ? new Date(schedule.endDate).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </span>
                  </div>

                  {schedule.location && (
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{schedule.location}</span>
                    </div>
                  )}

                  {schedule.description && (
                    <p className="text-gray-600 line-clamp-2">
                      {schedule.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex space-x-2">
                  <button
                    onClick={() => handleEditSchedule(schedule)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Chỉnh sửa
                  </button>

                  {schedule.status === "PLANNING" && (
                    <button
                      onClick={() =>
                        handleActivateSchedule(schedule.scheduleId)
                      }
                      className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Kích hoạt
                    </button>
                  )}

                  {schedule.status === "ACTIVE" && (
                    <button
                      onClick={() =>
                        handleDeactivateSchedule(schedule.scheduleId)
                      }
                      className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Hủy kích hoạt
                    </button>
                  )}

                  {schedule.status !== "ACTIVE" && (
                    <button
                      onClick={() => handleDeleteSchedule(schedule.scheduleId)}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {schedules.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Chưa có lịch bảo vệ nào
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Bắt đầu tạo lịch bảo vệ đầu tiên.
            </p>
            <div className="mt-6">
              <button
                onClick={handleCreateSchedule}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Tạo lịch bảo vệ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ScheduleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          editingSchedule={editingSchedule}
        />
      )}
    </div>
  );
};

// Modal Component
const ScheduleModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingSchedule,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingSchedule
                ? "Chỉnh sửa lịch bảo vệ"
                : "Tạo lịch bảo vệ mới"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên lịch bảo vệ *
              </label>
              <input
                type="text"
                required
                value={formData.scheduleName}
                onChange={(e) =>
                  setFormData({ ...formData, scheduleName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên lịch bảo vệ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Năm học ID
              </label>
              <input
                type="number"
                value={formData.academicYearId}
                onChange={(e) =>
                  setFormData({ ...formData, academicYearId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập ID năm học"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày kết thúc *
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa điểm
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập địa điểm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mô tả"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {editingSchedule ? "Cập nhật" : "Tạo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DefenseScheduleManagement;
