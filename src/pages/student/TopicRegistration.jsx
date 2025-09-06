import React, { useState, useEffect } from "react";
import Select from "react-select";
import registrationService from "../../services/registration.service";
import ThesisRegisterModal from "./ThesisRegister.jsx";
import { toast } from "react-toastify";

const difficultyMap = {
  ADVANCED: {
    label: "Khó",
    class: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  INTERMEDIATE: {
    label: "Trung bình",
    class: "bg-blue-100 text-blue-800 border-blue-200",
  },
  BEGINNER: {
    label: "Dễ",
    class: "bg-green-100 text-green-800 border-green-200",
  },
};

const TopicRegistration = () => {
  const [topics, setTopics] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registeringId, setRegisteringId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [topicsPerPage] = useState(10);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [periodLoading, setPeriodLoading] = useState(false);

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await registrationService.getAvailableTopicList();

        if (res.noActivePeriod) {
          setError(res.message);
          setTopics([]);
          return;
        }

        if (Array.isArray(res.data)) {
          setTopics(res.data);
        } else if (res.success) {
          setTopics(res.data || []);
        } else {
          setError(res.message || "Không thể tải danh sách đề tài");
        }

        // Lưu thông tin đợt đăng ký hiện tại
        if (res.currentPeriod) {
          setCurrentPeriod(res.currentPeriod);
        }
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải danh sách đề tài");
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const filterTopics = () => {
    return topics.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.topicCode.toLowerCase().includes(search.toLowerCase()) ||
        (t.supervisorName || "").toLowerCase().includes(search.toLowerCase());

      const matchesDepartment =
        !selectedDepartment || t.department === selectedDepartment;
      const matchesYear = !selectedYear || t.academicYear === selectedYear;

      return matchesSearch && matchesDepartment && matchesYear;
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
      const res = await registrationService.registerTopic(topicId);

      if (res.success) {
        // Cập nhật trạng thái đề tài thành "Pending" khi đăng ký thành công
        setTopics((prevTopics) =>
          prevTopics.map((topic) =>
            topic.topicId === topicId ? { ...topic, status: "Pending" } : topic
          )
        );
        toast.success(
          res.message ||
            "Đăng ký đề tài thành công! Vui lòng chờ giảng viên duyệt."
        );
      } else {
        toast.error(res.message || "Đăng ký đề tài thất bại");
      }
    } catch (err) {
      console.error("Lỗi khi đăng ký:", err);
      toast.error("Đã xảy ra lỗi khi đăng ký đề tài");
    } finally {
      setRegisteringId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedDepartment("");
    setSelectedYear("");
    setCurrentPage(1);
  };

  const filteredTopics = filterTopics();
  const indexOfLastTopic = currentPage * topicsPerPage;
  const indexOfFirstTopic = indexOfLastTopic - topicsPerPage;
  const currentTopics = filteredTopics.slice(
    indexOfFirstTopic,
    indexOfLastTopic
  );
  const totalPages = Math.ceil(filteredTopics.length / topicsPerPage);

  // Mock data cho departments và years (có thể thay bằng API thực tế)
  const departments = [
    "Khoa Công nghệ Thông tin",
    "Khoa Kỹ thuật Phần mềm",
    "Khoa Khoa học Máy tính",
    "Khoa Khoa học Dữ liệu",
    "Khoa An ninh Mạng",
  ];

  const years = ["2024-2025", "2023-2024", "2022-2023"];

  // Chuẩn bị data cho react-select
  const departmentOptions = [
    { value: "", label: "Chọn khoa" },
    ...departments.map((dept) => ({ value: dept, label: dept })),
  ];

  const yearOptions = [
    { value: "", label: "Chọn năm học" },
    ...years.map((year) => ({ value: year, label: year })),
  ];

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
      {/* Hiển thị thông tin đợt đăng ký hiện tại */}
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
              <p className="text-blue-700">
                Trạng thái:{" "}
                <span className="font-semibold">{currentPeriod.status}</span>
              </p>
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
        {/* Department Filter */}
        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <label className="font-semibold text-blue-900 text-sm uppercase tracking-wider">
            Khoa
          </label>
          <Select
            value={departmentOptions.find(
              (option) => option.value === selectedDepartment
            )}
            onChange={(selectedOption) =>
              setSelectedDepartment(selectedOption?.value || "")
            }
            options={departmentOptions}
            styles={customSelectStyles}
            placeholder="Chọn khoa"
            isClearable
            isSearchable
            className="text-sm"
          />
        </div>

        {/* Year Filter */}
        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <label className="font-semibold text-blue-900 text-sm uppercase tracking-wider">
            Năm học
          </label>
          <Select
            value={yearOptions.find((option) => option.value === selectedYear)}
            onChange={(selectedOption) =>
              setSelectedYear(selectedOption?.value || "")
            }
            options={yearOptions}
            styles={customSelectStyles}
            placeholder="Chọn năm học"
            isClearable
            isSearchable
            className="text-sm"
          />
        </div>

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
              className="w-full px-2.5 py-1.5 pl-8 border border-gray-300 rounded-md text-sm min-w-[180px] focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-colors"
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

      {error ? (
        <div className="text-center py-10 px-5 text-red-600 bg-red-50 border border-red-200 rounded-lg my-5">
          <p>{error}</p>
        </div>
      ) : (
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
                      {topic.supervisorName || `Dr. ${topic.supervisorId}`}
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
                        difficultyMap[topic.difficultyLevel]?.class || ""
                      }`}
                    >
                      {difficultyMap[topic.difficultyLevel]?.label ||
                        topic.difficultyLevel}
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
                      currentPage === page
                        ? "bg-blue-900 text-white border-blue-900"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-blue-900 hover:text-white hover:border-blue-900"
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                className="bg-white border border-gray-300 text-gray-600 rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-blue-900 hover:text-white hover:border-blue-900 min-w-[36px] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Tiếp
              </button>
            </div>
          )}

          {/* Pagination Info */}
          {filteredTopics.length > 0 && (
            <div className="text-center mb-4 text-gray-500 text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-md">
              <p className="m-0 p-3 bg-gray-50 rounded-md border border-gray-200">
                Hiển thị {indexOfFirstTopic + 1} đến {""}
                {Math.min(indexOfLastTopic, filteredTopics.length)} trong tổng
                số {filteredTopics.length} đề tài
              </p>
            </div>
          )}
        </>
      )}

      {/* Modal Đề xuất đề tài */}
      <ThesisRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
};

export default TopicRegistration;
