import React, { useState, useEffect, useRef, useMemo } from "react";
import { evalService } from "../../services/evalService";
import { showToast } from "../../utils/toastHelper";
import academicYearService from "../../services/academicYear.service";
import registrationPeriodService from "../../services/registrationPeriod.service";
import Select from "react-select";

const DefenseScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const rootRef = useRef(null);
  const didInitRef = useRef(false);
  const [formData, setFormData] = useState({
    scheduleName: "",
    academicYearId: "",
    startDate: "",
    endDate: "",
    location: "",
    description: "",
    createdBy: 1,
  });
  const [registrationPeriods, setRegistrationPeriods] = useState([]);
  const latestRegistrationEndDate = useMemo(() => {
    if (!Array.isArray(registrationPeriods) || registrationPeriods.length === 0)
      return null;
    let max = null;
    for (const p of registrationPeriods) {
      const endStr = p?.endDate || p?.end_date;
      if (!endStr) continue;
      const d = new Date(endStr);
      if (!isNaN(d)) {
        if (!max || d > max) max = d;
      }
    }
    return max;
  }, [registrationPeriods]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    loadSchedules();
    loadRegistrationPeriods();
  }, []);

  const loadRegistrationPeriods = async () => {
    try {
      const result = await registrationPeriodService.getAllPeriods();
      if (result?.success && Array.isArray(result.data)) {
        setRegistrationPeriods(result.data);
      } else if (Array.isArray(result)) {
        setRegistrationPeriods(result);
      } else {
        setRegistrationPeriods([]);
      }
    } catch (e) {
      setRegistrationPeriods([]);
    }
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await evalService.getAllDefenseSchedules();
      setSchedules(data);
    } catch (error) {
      showToast("Lỗi khi tải danh sách lịch bảo vệ");
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
    // Validate: startDate phải sau ngày kết thúc muộn nhất của các đợt đăng ký
    try {
      const latestEnd = latestRegistrationEndDate;
      if (latestEnd) {
        const start = formData.startDate ? new Date(formData.startDate) : null;
        if (!start || start <= latestEnd) {
          const d = new Date(latestEnd.getTime() + 24 * 60 * 60 * 1000);
          showToast(
            `Ngày bắt đầu lịch bảo vệ phải sau ${latestEnd.toLocaleDateString(
              "vi-VN"
            )} (chọn từ ${d.toLocaleDateString("vi-VN")})`,
            "error"
          );
          return;
        }
      }
    } catch (_) {}

    try {
      if (editingSchedule) {
        await evalService.updateDefenseSchedule(
          editingSchedule.scheduleId,
          formData
        );
        showToast("Cập nhật lịch bảo vệ thành công");
      } else {
        await evalService.createDefenseSchedule(formData);
        showToast("Tạo lịch bảo vệ thành công");
      }

      setIsModalOpen(false);
      loadSchedules();
    } catch (error) {
      showToast("Lỗi khi lưu lịch bảo vệ");
      console.error("Lỗi:", error);
    }
  };

  const getLatestRegistrationEndDate = () => {
    if (!Array.isArray(registrationPeriods) || registrationPeriods.length === 0)
      return null;
    let max = null;
    for (const p of registrationPeriods) {
      const endStr = p?.endDate || p?.end_date;
      if (!endStr) continue;
      const d = new Date(endStr);
      if (!isNaN(d)) {
        if (!max || d > max) max = d;
      }
    }
    return max;
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lịch bảo vệ này?")) {
      try {
        await evalService.deleteDefenseSchedule(scheduleId);
        showToast("Xóa lịch bảo vệ thành công");
        loadSchedules();
      } catch (error) {
        showToast("Lỗi khi xóa lịch bảo vệ");
        console.error("Lỗi:", error);
      }
    }
  };

  const handleActivateSchedule = async (scheduleId) => {
    try {
      await evalService.activateDefenseSchedule(scheduleId);
      showToast("Kích hoạt lịch bảo vệ thành công");
      loadSchedules();
    } catch (error) {
      showToast("Lỗi khi kích hoạt lịch bảo vệ");
      console.error("Lỗi:", error);
    }
  };

  const handleDeactivateSchedule = async (scheduleId) => {
    try {
      await evalService.deactivateDefenseSchedule(scheduleId);
      showToast("Hủy kích hoạt lịch bảo vệ thành công");
      loadSchedules();
    } catch (error) {
      showToast("Lỗi khi hủy kích hoạt lịch bảo vệ");
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
        className={`px-2 py-1 text-xs font-medium rounded-md ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  // Hiển thị nút quay về đầu trang khi scroll
  useEffect(() => {
    const mainEl = document.querySelector("main");
    const container = mainEl || window;

    const getScrollTop = () =>
      container === window
        ? window.pageYOffset || document.documentElement.scrollTop
        : container.scrollTop;

    const handleScroll = () => {
      setShowBackToTop(getScrollTop() > 10);
    };

    const target = container === window ? window : container;
    target.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => target.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBackToTop = () => {
    const mainEl = document.querySelector("main");
    const container = mainEl || window;
    if (container === window) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      container.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="bg-gray-50 py-8">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={handleCreateSchedule}
              className="bg-primary-500 hover:bg-primary-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
                className="bg-primary-500 hover:bg-primary-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Tạo lịch bảo vệ
              </button>
            </div>
          </div>
        )}
      </div>

      {showBackToTop && (
        <button
          type="button"
          onClick={handleBackToTop}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-lg bg-[#ea580c] text-white shadow-lg hover:brightness-95 transition-colors"
          aria-label="Quay về đầu trang"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      )}

      {/* Modal */}
      {isModalOpen && (
        <ScheduleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          editingSchedule={editingSchedule}
          latestRegistrationEndDate={latestRegistrationEndDate}
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
  latestRegistrationEndDate,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
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
            {editingSchedule ? "Chỉnh sửa lịch bảo vệ" : "Tạo lịch bảo vệ mới"}
          </h2>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = (formData.scheduleName || "").trim();
            const yearId = formData.academicYearId;
            const start = formData.startDate
              ? new Date(formData.startDate)
              : null;
            const end = formData.endDate ? new Date(formData.endDate) : null;
            const location = (formData.location || "").trim();
            const description = (formData.description || "").trim();
            const now = new Date();
            const today = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );

            if (!name) {
              alert("Vui lòng nhập tên lịch bảo vệ");
              return;
            }
            if (!yearId && yearId !== 0) {
              alert("Vui lòng chọn năm học");
              return;
            }
            if (!start) {
              alert("Vui lòng chọn ngày bắt đầu");
              return;
            }
            if (!end) {
              alert("Vui lòng chọn ngày kết thúc");
              return;
            }
            if (!location) {
              alert("Vui lòng nhập địa điểm");
              return;
            }
            if (!description) {
              alert("Vui lòng nhập mô tả");
              return;
            }
            if (start < today) {
              alert("Ngày bắt đầu phải lớn hơn hoặc bằng ngày hiện tại");
              return;
            }
            if (end <= start) {
              alert("Ngày kết thúc phải lớn hơn ngày bắt đầu");
              return;
            }

            onSubmit(e);
          }}
          className="p-6 space-y-6"
        >
          <div>
            <div className="relative">
              <input
                id="scheduleName"
                type="text"
                placeholder=" "
                required
                value={formData.scheduleName}
                onChange={(e) =>
                  setFormData({ ...formData, scheduleName: e.target.value })
                }
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-lg bg-white peer"
              />
              <label
                htmlFor="scheduleName"
                className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
              >
                Tên lịch bảo vệ <span className="text-red-500">*</span>
              </label>
            </div>
          </div>

          <div>
            <label
              htmlFor="academicYearId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Năm học <span className="text-red-500">*</span>
            </label>
            <AcademicYearSelect
              id="academicYearId"
              value={formData.academicYearId}
              onChange={(val) =>
                setFormData({ ...formData, academicYearId: val })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={(function () {
                  const latest = latestRegistrationEndDate;
                  if (!latest) return todayStr;
                  const d = new Date(
                    latest.getFullYear(),
                    latest.getMonth(),
                    latest.getDate() + 1
                  );
                  return d.toISOString().split("T")[0];
                })()}
                value={formData.startDate}
                onChange={(e) => {
                  const newStart = e.target.value;
                  if (!newStart) {
                    setFormData({ ...formData, startDate: "" });
                    return;
                  }
                  const start = new Date(newStart);
                  const latest = latestRegistrationEndDate;
                  if (latest && start <= latest) {
                    const d = new Date(latest.getTime() + 24 * 60 * 60 * 1000);
                    alert(
                      `Ngày bắt đầu phải sau ${latest.toLocaleDateString(
                        "vi-VN"
                      )} (chọn từ ${d.toLocaleDateString("vi-VN")})`
                    );
                    return;
                  }
                  const autoEnd = new Date(start);
                  autoEnd.setDate(autoEnd.getDate() + 1);
                  const autoEndStr = autoEnd.toISOString().split("T")[0];
                  setFormData({
                    ...formData,
                    startDate: newStart,
                    endDate:
                      formData.endDate && new Date(formData.endDate) > start
                        ? formData.endDate
                        : autoEndStr,
                  });
                }}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={formData.startDate || todayStr}
                value={formData.endDate}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  if (!newEnd) {
                    setFormData({ ...formData, endDate: "" });
                    return;
                  }
                  const start = formData.startDate
                    ? new Date(formData.startDate)
                    : null;
                  const end = new Date(newEnd);
                  if (start && end <= start) {
                    alert("Ngày kết thúc phải lớn hơn ngày bắt đầu");
                    return;
                  }
                  setFormData({ ...formData, endDate: newEnd });
                }}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-lg bg-white"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <input
                id="location"
                type="text"
                placeholder=" "
                required
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-lg bg-white peer"
              />
              <label
                htmlFor="location"
                className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
              >
                Địa điểm <span className="text-red-500">*</span>
              </label>
            </div>
          </div>

          <div>
            <div className="relative">
              <textarea
                id="description"
                placeholder=" "
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-primary-500 focus:shadow-lg bg-white peer"
              />
              <label
                htmlFor="description"
                className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
              >
                Mô tả <span className="text-red-500">*</span>
              </label>
            </div>
          </div>

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
              {editingSchedule ? "Cập nhật" : "Tạo lịch bảo vệ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AcademicYearSelect = ({ id, value, onChange }) => {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await academicYearService.getAllAcademicYears();
        if (result.success && Array.isArray(result.data)) {
          setYears(result.data);
        } else {
          setYears([]);
        }
      } catch (e) {
        setYears([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const options = years.map((y) => ({
    value: y.academicYearId,
    label: y.yearName,
  }));
  const selected = options.find((o) => o.value === value) || null;

  return (
    <Select
      inputId={id}
      value={selected}
      onChange={(opt) => onChange(opt ? opt.value : "")}
      options={options}
      isLoading={loading}
      placeholder={loading ? "Đang tải..." : "Chọn năm học"}
      isSearchable
      classNamePrefix="react-select"
      menuPortalTarget={document.body}
      styles={{
        control: (base) => ({
          ...base,
          borderRadius: 8,
          minHeight: 40,
          borderColor: "#d1d5db",
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        menu: (base) => ({ ...base, zIndex: 9999 }),
      }}
    />
  );
};

export default DefenseScheduleManagement;
