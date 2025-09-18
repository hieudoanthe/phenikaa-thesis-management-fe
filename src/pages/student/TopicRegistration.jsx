import React, { useState, useEffect } from "react";
import Select from "react-select";
import registrationService from "../../services/registration.service";
import { userService } from "../../services";
import registrationPeriodService from "../../services/registrationPeriod.service";
import ThesisRegisterModal from "./ThesisRegister.jsx";
import { toast } from "react-toastify";

// Helper hiển thị toast sử dụng react-toastify
const showToast = (message, type = "success") => {
  try {
    if (type === "error") return toast.error(message);
    if (type === "warning") return toast.warn(message);
    if (type === "info") return toast.info(message);
    return toast.success(message);
  } catch (err) {
    console.error("Không thể hiển thị toast:", err);
    (type === "success" ? console.log : console.error)(message);
  }
};

const difficultyMap = {
  ADVANCED: {
    label: "Khó",
    class: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  HARD: {
    label: "Khó",
    class: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  INTERMEDIATE: {
    label: "Trung bình",
    class: "bg-blue-100 text-blue-800 border-blue-200",
  },
  MEDIUM: {
    label: "Trung bình",
    class: "bg-blue-100 text-blue-800 border-blue-200",
  },
  BEGINNER: {
    label: "Dễ",
    class: "bg-green-100 text-green-800 border-green-200",
  },
  EASY: {
    label: "Dễ",
    class: "bg-green-100 text-green-800 border-green-200",
  },
};

const translateDifficulty = (level) => {
  if (!level) return "";
  const key = String(level).toUpperCase();
  return difficultyMap[key]?.label || level;
};

const TopicRegistration = () => {
  const [topics, setTopics] = useState([]);
  const [search, setSearch] = useState("");
  const [serverPage, setServerPage] = useState(0);
  const [serverSize] = useState(12);
  const [serverTotalPages, setServerTotalPages] = useState(0);
  // Bỏ lọc theo Khoa và Năm học
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registeringId, setRegisteringId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [topicsPerPage] = useState(10);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [activePeriods, setActivePeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [lecturerNameMap, setLecturerNameMap] = useState({});

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await registrationService.getAvailableTopicList();
        const periodsRes = await registrationPeriodService.getActivePeriods();

        // Không vội hiển thị lỗi nếu API currentPeriod không có; đợi kiểm tra activePeriods

        if (Array.isArray(res.data)) {
          setTopics(res.data);
        } else if (res.success) {
          setTopics(res.data || []);
        } else {
          setError(res.message || "Không thể tải danh sách đề tài");
        }

        // Lưu thông tin đợt đăng ký hiện tại
        if (periodsRes.success && Array.isArray(periodsRes.data)) {
          setActivePeriods(periodsRes.data);
          if (!selectedPeriodId && periodsRes.data.length > 0) {
            setSelectedPeriodId(periodsRes.data[0].periodId);
            setCurrentPeriod(periodsRes.data[0]);
          }
          // Nếu có ít nhất 1 đợt ACTIVE, clear lỗi
          if (periodsRes.data.length > 0) {
            setError("");
          } else {
            // Nếu không có đợt nào ACTIVE
            setError("Hiện tại không có đợt đăng ký nào đang diễn ra!");
          }
        }
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải danh sách đề tài");
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  // Cập nhật currentPeriod khi selectedPeriodId thay đổi
  useEffect(() => {
    if (selectedPeriodId && activePeriods.length > 0) {
      const selectedPeriod = activePeriods.find(
        (p) => p.periodId === selectedPeriodId
      );
      if (selectedPeriod) {
        setCurrentPeriod(selectedPeriod);
      }
    }
  }, [selectedPeriodId, activePeriods]);

  // Tải danh sách giảng viên để ánh xạ supervisorId -> fullName
  useEffect(() => {
    const loadLecturers = async () => {
      try {
        const teachers = await userService.getAllTeachers();
        const map = {};
        (teachers || []).forEach((t) => {
          if (t?.userId)
            map[t.userId] = t.fullName || t.name || `GV ${t.userId}`;
        });
        setLecturerNameMap(map);
      } catch (e) {
        // ignore
      }
    };
    loadLecturers();
  }, []);

  // Gọi API filter khi search thay đổi hoặc serverPage thay đổi
  useEffect(() => {
    // Chỉ gọi filterTopics khi search có giá trị thực sự
    if (!search.trim()) return;

    const doFilter = async () => {
      try {
        const payload = {
          searchPattern: search || undefined,
          page: serverPage,
          size: serverSize,
          sortBy: "topicId",
          sortDirection: "DESC",
          userRole: "STUDENT",
        };
        const res = await registrationService.filterTopics(payload);
        if (res.success && res.data) {
          setTopics(res.data.content || []);
          setServerTotalPages(res.data.totalPages || 0);
        }
      } catch (e) {
        // ignore
      }
    };
    doFilter();
  }, [search, serverPage]);

  // Đồng bộ panel "đợt hiện tại" theo lựa chọn dropdown
  useEffect(() => {
    if (!selectedPeriodId) return;
    const found = activePeriods.find((p) => p.periodId === selectedPeriodId);
    if (found) setCurrentPeriod(found);
  }, [selectedPeriodId, activePeriods]);

  const filterTopics = () => {
    return topics.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.topicCode.toLowerCase().includes(search.toLowerCase()) ||
        (t.supervisorName || "").toLowerCase().includes(search.toLowerCase());

      return matchesSearch;
    });
  };

  const getStatusColor = (status) => {
    if (status === "Approved") return "bg-green-600 hover:bg-green-700";
    if (status === "Pending") return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-orange-500 hover:bg-orange-600";
  };

  const handleRegister = async (topicId) => {
    setRegisteringId(topicId);
    try {
      if (!selectedPeriodId) {
        showToast("Vui lòng chọn đợt đăng ký", "error");
        return;
      }
      const res = await registrationService.registerTopic(
        topicId,
        selectedPeriodId
      );

      if (res.success) {
        // Cập nhật trạng thái đề tài thành "Pending" khi đăng ký thành công
        setTopics((prevTopics) =>
          prevTopics.map((topic) =>
            topic.topicId === topicId ? { ...topic, status: "Pending" } : topic
          )
        );
        showToast(
          res.message ||
            "Đăng ký đề tài thành công! Vui lòng chờ giảng viên duyệt."
        );
      } else {
        showToast(res.message || "Đăng ký đề tài thất bại");
      }
    } catch (err) {
      console.error("Lỗi khi đăng ký:", err);
      showToast("Đã xảy ra lỗi khi đăng ký đề tài");
    } finally {
      setRegisteringId(null);
    }
  };

  const clearFilters = async () => {
    setSearch("");
    setCurrentPage(1);
    // Reload lại dữ liệu gốc từ getAvailableTopicList
    try {
      const res = await registrationService.getAvailableTopicList();
      if (Array.isArray(res.data)) {
        setTopics(res.data);
      } else if (res.success) {
        setTopics(res.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi reload danh sách đề tài:", err);
    }
  };

  const filteredTopics = topics; // đã lọc từ server
  const currentTopics = filteredTopics;
  const totalPages = serverTotalPages || 1;

  // Options cho react-select của danh sách đợt đăng ký
  const periodOptions = activePeriods.map((p) => ({
    value: p.periodId,
    label: `${p.periodName} (${new Date(p.startDate).toLocaleDateString(
      "vi-VN"
    )} - ${new Date(p.endDate).toLocaleDateString("vi-VN")})`,
  }));

  // Đã bỏ data filter theo Khoa và Năm học

  // Custom styles cho react-select
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: "38px",
      borderColor: state.isFocused ? "#ea580c" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(234, 88, 12, 0.1)" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#ea580c" : "#9ca3af",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#ea580c"
        : state.isFocused
        ? "#fed7aa"
        : "white",
      color: state.isSelected ? "white" : "#374151",
      "&:hover": {
        backgroundColor: state.isSelected ? "#ea580c" : "#fed7aa",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
      fontSize: "14px",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#374151",
      fontSize: "14px",
    }),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải danh sách đề tài...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-3">
      {/* Chọn đợt đăng ký (nhiều đợt song song) */}
      {activePeriods.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <label className="block text-sm font-semibold text-green-800 mb-2">
            Chọn đợt đăng ký
          </label>
          <Select
            value={
              periodOptions.find((o) => o.value === selectedPeriodId) || null
            }
            onChange={(opt) => setSelectedPeriodId(opt?.value || null)}
            options={periodOptions}
            styles={customSelectStyles}
            placeholder="Chọn đợt đăng ký"
            isClearable={false}
            className="text-sm"
          />
        </div>
      )}

      {/* Hiển thị thông tin đợt đăng ký hiện tại (giữ lại để tương thích UI cũ) */}
      {currentPeriod && (
        <div className="current-period-info bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Đợt đăng ký hiện tại: {currentPeriod.periodName}
              </h3>
              <p className="text-blue-700">
                Thời gian:{" "}
                {new Date(currentPeriod.startDate).toLocaleDateString("vi-VN")}{" "}
                - {new Date(currentPeriod.endDate).toLocaleDateString("vi-VN")}
              </p>
              {/* Bỏ hiển thị Trạng thái: ACTIVE */}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {new Date(currentPeriod.endDate).getTime() > Date.now()
                  ? "Đang diễn ra"
                  : "Đã kết thúc"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hiển thị thông báo khi không có đợt đăng ký */}
      {error && error.includes("không có đợt đăng ký") && (
        <div className="no-period-warning bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-center">
          <div className="text-yellow-800">
            <h3 className="text-lg font-semibold mb-2">
              Không có đợt đăng ký nào đang diễn ra
            </h3>
            <p>
              Vui lòng chờ đến đợt đăng ký tiếp theo để có thể đăng ký đề tài.
            </p>
          </div>
        </div>
      )}

      {/* Nút mở modal đề xuất đề tài */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #ea580c 100%, #fb923c 0%)",
          }}
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
          Đề xuất đề tài mới
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 mb-4 flex gap-3.5 items-end flex-wrap">
        {/* Search Filter */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[300px]">
          <label className="font-semibold text-blue-900 text-sm uppercase tracking-wider">
            Tìm kiếm
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 z-10"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo từ khóa hoặc giảng viên"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2.5 py-1.5 pl-8 border border-gray-300 rounded-md text-sm min-w-[180px] outline-none focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-colors"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <button
          className="px-3 py-1.5 bg-gray-500 text-white border-none rounded-md text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-gray-600 hover:-translate-y-0.5 whitespace-nowrap self-end"
          onClick={clearFilters}
        >
          Xóa bộ lọc
        </button>
      </div>

      {!error && (
        <>
          {/* Topics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 mb-4">
            {currentTopics.map((topic) => (
              <div
                key={topic.topicId}
                className="border border-gray-200 rounded-lg bg-white p-3.5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-orange-500 transition-all duration-200 flex flex-col gap-2.5 min-h-[180px]"
              >
                {/* Topic Title */}
                <div className="text-sm font-semibold text-gray-900 leading-tight m-0">
                  {topic.title}
                </div>

                {/* Topic Description */}
                <div className="text-xs text-gray-500 leading-relaxed m-0 flex-grow">
                  {topic.description}
                </div>

                {/* Topic Meta */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 flex flex-col gap-1.5">
                  {/* Supervisor */}
                  <div className="flex justify-between items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[55px]">
                      Giảng viên:
                    </span>
                    <span className="text-xs font-medium text-purple-600 font-semibold">
                      {lecturerNameMap[topic.supervisorId] ||
                        topic.supervisorName ||
                        "Đang cập nhật"}
                    </span>
                  </div>

                  {/* Slots */}
                  <div className="flex justify-between items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[55px]">
                      Số lượng:
                    </span>
                    <span
                      className={`text-xs font-medium font-semibold ${
                        topic.currentStudents >= topic.maxStudents
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {topic.currentStudents}/{topic.maxStudents} chỗ trống
                    </span>
                  </div>

                  {/* Difficulty */}
                  <div className="flex justify-between items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[55px]">
                      Độ khó:
                    </span>
                    <span
                      className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border ${
                        difficultyMap[
                          String(topic.difficultyLevel).toUpperCase()
                        ]?.class || ""
                      }`}
                    >
                      {translateDifficulty(topic.difficultyLevel)}
                    </span>
                  </div>
                </div>

                {/* Register Button */}
                <button
                  className={`mt-auto py-2 px-0 rounded-md font-semibold text-xs uppercase tracking-wider cursor-pointer transition-all duration-200 shadow-sm ${
                    topic.status === "Approved" ||
                    topic.status === "Pending" ||
                    registeringId === topic.topicId ||
                    topic.currentStudents >= topic.maxStudents
                      ? "opacity-60 cursor-not-allowed"
                      : getStatusColor(topic.status)
                  } ${
                    topic.status === "Approved"
                      ? "bg-green-600 text-white"
                      : topic.status === "Pending"
                      ? "bg-yellow-500 text-gray-900"
                      : "text-white"
                  }`}
                  disabled={
                    topic.status === "Approved" ||
                    topic.status === "Pending" ||
                    registeringId === topic.topicId ||
                    topic.currentStudents >= topic.maxStudents
                  }
                  onClick={() => handleRegister(topic.topicId)}
                >
                  {registeringId === topic.topicId
                    ? "Đang đăng ký..."
                    : topic.status === "Approved"
                    ? "Đã duyệt"
                    : topic.status === "Pending"
                    ? "Đang chờ"
                    : topic.currentStudents >= topic.maxStudents
                    ? "Hết chỗ"
                    : "Đăng ký"}
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 my-4 items-center">
              <button
                className="bg-white border border-gray-300 text-gray-600 rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-blue-900 hover:text-white hover:border-blue-900 min-w-[36px] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`border rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all duration-200 min-w-[36px] ${
                      serverPage + 1 === page
                        ? "bg-blue-900 text-white border-blue-900"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-blue-900 hover:text-white hover:border-blue-900"
                    }`}
                    onClick={() => setServerPage(page - 1)}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                className="bg-white border border-gray-300 text-gray-600 rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-blue-900 hover:text-white hover:border-blue-900 min-w-[36px] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() =>
                  setServerPage((prev) => Math.min(prev + 1, totalPages - 1))
                }
                disabled={serverPage + 1 === totalPages}
              >
                Tiếp
              </button>
            </div>
          )}

          {/* Pagination Info */}
          {filteredTopics.length > 0 && (
            <div className="text-center mb-4 text-gray-500 text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-md">
              <p className="m-0 p-3 bg-gray-50 rounded-md border border-gray-200">
                Trang {serverPage + 1}/{totalPages} — {filteredTopics.length} đề
                tài hiển thị
              </p>
            </div>
          )}
        </>
      )}

      {/* Modal Đề xuất đề tài */}
      <ThesisRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        selectedPeriod={currentPeriod}
      />
    </div>
  );
};

export default TopicRegistration;
