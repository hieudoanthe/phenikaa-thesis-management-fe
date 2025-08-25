import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await registrationService.getAvailableTopicList();
        if (Array.isArray(res)) {
          setTopics(res);
        } else if (res.success) {
          setTopics(res.data || []);
        } else {
          setError(res.message || "Không thể tải danh sách đề tài");
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

  return (
    <div className="max-w-full mx-auto p-3">
      {/* Nút mở modal đề xuất đề tài */}
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={() => setIsRegisterModalOpen(true)}
          className="px-3 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600 transition-colors"
        >
          Đề xuất đề tài mới
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 mb-4 flex gap-3.5 items-end flex-wrap">
        {/* Department Filter */}
        <div className="flex flex-col gap-1.5 min-w-[130px]">
          <label className="font-semibold text-blue-900 text-sm uppercase tracking-wider">
            Khoa
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-md text-sm min-w-[130px] focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-colors"
          >
            <option value="">Chọn khoa</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div className="flex flex-col gap-1.5 min-w-[130px]">
          <label className="font-semibold text-blue-900 text-sm uppercase tracking-wider">
            Năm học
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-md text-sm min-w-[130px] focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-colors"
          >
            <option value="">Chọn năm học</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
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

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-15 px-5 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p>Đang tải danh sách đề tài...</p>
        </div>
      ) : error ? (
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
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
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
