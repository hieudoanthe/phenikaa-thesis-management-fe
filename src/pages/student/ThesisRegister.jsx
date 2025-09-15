import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { suggestTopicForStudent } from "../../services/suggest.service";
import { userService } from "../../services";
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
import registrationPeriodService from "../../services/registrationPeriod.service";
import lecturerCapacityService from "../../services/lecturerCapacity.service";

// Department mapping
const departmentMapping = {
  CNTT: "Công nghệ thông tin",
  KHMT: "Khoa học máy tính",
  KTMT: "Kỹ thuật máy tính",
  HTTT: "Hệ thống thông tin",
  KTPM: "Kỹ thuật phần mềm",
  ATTT: "An toàn thông tin",
  MMT: "Mạng máy tính",
  PM: "Phần mềm",
};

const initialForm = {
  tieuDe: "",
  moTa: "",
  mucTieu: "",
  phuongPhap: "",
  ketQuaDuKien: "",
  giangVien: null,
  lyDo: "",
};

const fields = [
  { name: "tieuDe", label: "Tên đề tài", type: "text", required: true },
  {
    name: "moTa",
    label: "Mô tả đề tài",
    type: "textarea",
    required: true,
  },
  { name: "mucTieu", label: "Mục tiêu", type: "textarea", required: true },
  {
    name: "phuongPhap",
    label: "Phương pháp thực hiện",
    type: "textarea",
    required: true,
  },
  {
    name: "ketQuaDuKien",
    label: "Kết quả dự kiến",
    type: "textarea",
    required: true,
  },
];

const fieldsOfStudy = [
  "Computer Science",
  "Information Systems",
  "Software Engineering",
  "Cybersecurity",
  "Data Science",
];

const ThesisRegisterModal = ({ isOpen, onClose, selectedPeriod }) => {
  if (!isOpen) return null;
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showLecturerList, setShowLecturerList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // State cho danh sách giảng viên từ API
  const [lecturers, setLecturers] = useState([]);
  const [loadingLecturers, setLoadingLecturers] = useState(false);
  const [errorLecturers, setErrorLecturers] = useState("");

  // State cho đợt đăng ký
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [periodLoading, setPeriodLoading] = useState(false);

  // Đồng bộ đợt đăng ký từ parent nếu truyền vào; fallback gọi API cũ khi thiếu
  useEffect(() => {
    if (!isOpen) return;
    if (selectedPeriod) {
      setCurrentPeriod(selectedPeriod);
      return;
    }
    checkRegistrationPeriod();
  }, [isOpen, selectedPeriod]);

  const checkRegistrationPeriod = async () => {
    setPeriodLoading(true);
    try {
      const periodResult = await registrationPeriodService.getCurrentPeriod();
      if (periodResult.success && periodResult.data) {
        setCurrentPeriod(periodResult.data);
      } else {
        setCurrentPeriod(null);
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra đợt đăng ký:", error);
      setCurrentPeriod(null);
    } finally {
      setPeriodLoading(false);
    }
  };

  // Gọi API lấy danh sách giảng viên khi có đợt đăng ký
  useEffect(() => {
    if (currentPeriod) {
      const fetchLecturers = async () => {
        setLoadingLecturers(true);
        setErrorLecturers("");
        try {
          const response = await userService.getAllTeachers();

          // Chuyển đổi dữ liệu từ API sang format phù hợp với UI
          // Lấy capacity thực tế từ LecturerCapacity nếu có đợt đăng ký
          const formattedLecturers = await Promise.all(
            response?.map(async (teacher) => {
              let capacity = null;
              let remainingSlots = 0;

              // Nếu có đợt đăng ký, lấy capacity thực tế
              if (currentPeriod) {
                try {
                  const capacityResult =
                    await lecturerCapacityService.getLecturerCapacity(
                      teacher.userId,
                      currentPeriod.periodId
                    );
                  if (capacityResult.success && capacityResult.data) {
                    capacity = capacityResult.data;
                    remainingSlots = Math.max(
                      0,
                      capacity.maxStudents - capacity.currentStudents
                    );
                  }
                } catch (error) {
                  console.error(
                    `Lỗi khi lấy capacity cho lecturer ${teacher.userId}:`,
                    error
                  );
                }
              }

              // Nếu không có capacity, sử dụng giá trị mặc định
              if (!capacity) {
                remainingSlots = currentPeriod
                  ? currentPeriod.maxStudentsPerLecturer
                  : 15;
              }

              return {
                id: teacher.userId,
                name: teacher.fullName || "Chưa có tên",
                email: teacher.phoneNumber || "Chưa có thông tin liên lạc",
                avatar:
                  teacher.avt ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    teacher.fullName || "GV"
                  )}&background=random`,
                specialization:
                  teacher.specialization || "Chưa có chuyên ngành",
                department: teacher.department || "Chưa có khoa",
                remainingSlots: remainingSlots,
                maxStudents: capacity
                  ? capacity.maxStudents
                  : currentPeriod
                  ? currentPeriod.maxStudentsPerLecturer
                  : 15,
                currentStudents: capacity ? capacity.currentStudents : 0,
                status: remainingSlots > 0 ? "Available" : "Unavailable",
              };
            }) || []
          );

          setLecturers(formattedLecturers);
        } catch (err) {
          console.error("Lỗi khi lấy danh sách giảng viên:", err);
          setErrorLecturers(
            "Không thể tải danh sách giảng viên. Vui lòng thử lại sau."
          );
        } finally {
          setLoadingLecturers(false);
        }
      };

      fetchLecturers();
    }
  }, [currentPeriod]);

  // Xử lý thay đổi trường nhập liệu
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Chọn giảng viên
  const handleLecturerSelect = (giangVien) => {
    setForm((prev) => ({ ...prev, giangVien }));
    setShowLecturerList(false);
    setSearchQuery(giangVien.name); // Hiển thị tên giảng viên đã chọn trong input
  };

  // Xử lý submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    // Chuẩn bị dữ liệu đúng với SuggestTopicDTO
    const data = {
      title: form.tieuDe,
      description: form.moTa,
      objectives: form.mucTieu,
      methodology: form.phuongPhap,
      expectedOutcome: form.ketQuaDuKien,
      supervisorId: form.giangVien?.id || null,
      reason: form.lyDo,
    };
    try {
      await suggestTopicForStudent(data);
      setSuccess(true);
      setForm(initialForm);
      setSearchQuery(""); // Reset search input
      showToast("Đề xuất đề tài thành công!");
      onClose?.();
    } catch (err) {
      const errorMessage = err?.message || "Có lỗi xảy ra, vui lòng thử lại!";
      setError(errorMessage);
      showToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Lọc giảng viên theo tên hoặc email
  const filteredLecturers = lecturers.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      tabIndex={-1}
    >
      <div
        className="relative flex flex-col lg:flex-row gap-8 mx-auto my-4 px-6 py-8 bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto thin-scrollbar animate-in slide-in-from-bottom-4 duration-500"
        onClick={(e) => {
          e.stopPropagation();
          if (
            showLecturerList &&
            dropdownRef.current &&
            !dropdownRef.current.contains(e.target) &&
            searchInputRef.current &&
            !searchInputRef.current.contains(e.target)
          ) {
            setShowLecturerList(false);
          }
        }}
      >
        {/* Form Card */}
        <div className="flex-1 lg:flex-[1.2] bg-gradient-to-br from-white to-blue-50/30 rounded-3xl p-8 lg:p-10 flex flex-col gap-6 min-w-0 border border-blue-100/50">
          {/* Header Section */}
          <div className="text-center mb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mb-4 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent mb-3">
              Đề xuất đề tài khóa luận
            </h2>
            <p className="text-gray-600 text-base lg:text-lg">
              Vui lòng điền đầy đủ thông tin để đề xuất đề tài của bạn
            </p>
          </div>

          {/* Notice Box */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3 text-sm mb-6 shadow-sm">
            <div>
              <p className="font-medium">Lưu ý quan trọng</p>
              <p className="text-amber-700 mt-1">
                Bạn chỉ được đề xuất 1 đề tài tại một thời điểm. Hãy kiểm tra kỹ
                thông tin trước khi gửi.
              </p>
            </div>
          </div>

          {/* Hiển thị thông tin đợt đăng ký */}
          {currentPeriod && (
            <div className="period-info bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg
                      className="w-6 h-6 text-white"
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
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-900 mb-1">
                      {currentPeriod.periodName}
                    </h3>
                    <p className="text-blue-700 text-sm">
                      <span className="font-medium">Thời gian:</span>{" "}
                      {new Date(currentPeriod.startDate).toLocaleDateString(
                        "vi-VN"
                      )}{" "}
                      -{" "}
                      {new Date(currentPeriod.endDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                      new Date(currentPeriod.endDate).getTime() > Date.now()
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-sm ${
                        new Date(currentPeriod.endDate).getTime() > Date.now()
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    {new Date(currentPeriod.endDate).getTime() > Date.now()
                      ? "Đang diễn ra"
                      : "Đã kết thúc"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hiển thị cảnh báo khi không có đợt đăng ký */}
          {!currentPeriod && !periodLoading && (
            <div className="no-period-warning bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">
                  Không có đợt đăng ký nào đang diễn ra
                </h3>
                <p className="text-amber-700 text-base">
                  Vui lòng chờ đến đợt đăng ký tiếp theo để có thể đề xuất đề
                  tài.
                </p>
              </div>
            </div>
          )}

          {/* Form đề xuất đề tài - chỉ hiển thị khi có đợt đăng ký */}
          {currentPeriod && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tên đề tài */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <input
                  id="tieuDe"
                  type="text"
                  name="tieuDe"
                  placeholder=" "
                  value={form.tieuDe}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 pt-7 text-sm border-2 border-gray-200 rounded-xl outline-none transition-all duration-300 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-100 bg-white peer hover:border-gray-300"
                />
                <label
                  htmlFor="tieuDe"
                  className="absolute top-3 left-10 text-sm text-gray-500 transition-all duration-300 pointer-events-none bg-white px-2 peer-focus:text-blue-600 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-semibold peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold"
                >
                  Tên đề tài <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Mô tả đề tài */}
              <div className="relative group">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                </div>
                <textarea
                  id="moTa"
                  name="moTa"
                  placeholder=" "
                  value={form.moTa}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 pt-7 text-sm border-2 border-gray-200 rounded-xl outline-none transition-all duration-300 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-100 bg-white peer resize-none hover:border-gray-300"
                  rows={3}
                />
                <label
                  htmlFor="moTa"
                  className="absolute top-3 left-10 text-sm text-gray-500 transition-all duration-300 pointer-events-none bg-white px-2 peer-focus:text-blue-600 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-semibold peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold"
                >
                  Mô tả đề tài <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Mục tiêu */}
              <div className="relative group">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <textarea
                  id="mucTieu"
                  name="mucTieu"
                  placeholder=" "
                  value={form.mucTieu}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 pt-7 text-sm border-2 border-gray-200 rounded-xl outline-none transition-all duration-300 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-100 bg-white peer resize-none hover:border-gray-300"
                  rows={3}
                />
                <label
                  htmlFor="mucTieu"
                  className="absolute top-3 left-10 text-sm text-gray-500 transition-all duration-300 pointer-events-none bg-white px-2 peer-focus:text-blue-600 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-semibold peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold"
                >
                  Mục tiêu <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Phương pháp thực hiện */}
              <div className="relative group">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <textarea
                  id="phuongPhap"
                  name="phuongPhap"
                  placeholder=" "
                  value={form.phuongPhap}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 pt-7 text-sm border-2 border-gray-200 rounded-xl outline-none transition-all duration-300 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-100 bg-white peer resize-none hover:border-gray-300"
                  rows={3}
                />
                <label
                  htmlFor="phuongPhap"
                  className="absolute top-3 left-10 text-sm text-gray-500 transition-all duration-300 pointer-events-none bg-white px-2 peer-focus:text-blue-600 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-semibold peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold"
                >
                  Phương pháp thực hiện <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Kết quả dự kiến */}
              <div className="relative group">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <textarea
                  id="ketQuaDuKien"
                  name="ketQuaDuKien"
                  placeholder=" "
                  value={form.ketQuaDuKien}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 pt-7 text-sm border-2 border-gray-200 rounded-xl outline-none transition-all duration-300 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-100 bg-white peer resize-none hover:border-gray-300"
                  rows={3}
                />
                <label
                  htmlFor="ketQuaDuKien"
                  className="absolute top-3 left-10 text-sm text-gray-500 transition-all duration-300 pointer-events-none bg-white px-2 peer-focus:text-blue-600 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-semibold peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold"
                >
                  Kết quả dự kiến <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Lý do đề xuất */}
              <div className="relative group">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <textarea
                  id="lyDo"
                  name="lyDo"
                  placeholder=" "
                  value={form.lyDo}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 pt-7 text-sm border-2 border-gray-200 rounded-xl outline-none transition-all duration-300 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-100 bg-white peer resize-none hover:border-gray-300"
                  required
                  rows={3}
                />
                <label
                  htmlFor="lyDo"
                  className="absolute top-3 left-10 text-sm text-gray-500 transition-all duration-300 pointer-events-none bg-white px-2 peer-focus:text-blue-600 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-semibold peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold"
                >
                  Lý do đề xuất <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Lecturer Autocomplete - Full Width */}
              <div className="relative mb-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    id="lecturer-search"
                    type="text"
                    placeholder=" "
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      setShowLecturerList(true);

                      // Nếu xóa hết input, reset giảng viên đã chọn
                      if (!value.trim()) {
                        setForm((prev) => ({ ...prev, giangVien: null }));
                      }
                    }}
                    onKeyDown={(e) => {
                      // Xử lý phím Enter để chọn giảng viên đầu tiên
                      if (
                        e.key === "Enter" &&
                        showLecturerList &&
                        filteredLecturers.length > 0
                      ) {
                        e.preventDefault();
                        const firstLecturer = filteredLecturers[0];
                        handleLecturerSelect(firstLecturer);
                      }
                      // Xử lý phím Escape để đóng dropdown
                      if (e.key === "Escape") {
                        setShowLecturerList(false);
                      }
                    }}
                    onFocus={() => setShowLecturerList(true)}
                    ref={searchInputRef}
                    className="w-full pl-10 pr-4 py-3 pt-7 text-sm border-2 border-gray-200 rounded-xl outline-none transition-all duration-300 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-100 bg-white peer hover:border-gray-300"
                  />
                  <label
                    htmlFor="lecturer-search"
                    className="absolute top-3 left-10 text-sm text-gray-500 transition-all duration-300 pointer-events-none bg-white px-2 peer-focus:text-blue-600 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-semibold peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold"
                  >
                    Giảng viên hướng dẫn mong muốn{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  {/* Lecturer Dropdown */}
                  {showLecturerList && (
                    <div
                      ref={dropdownRef}
                      className="absolute left-0 right-0 bottom-full mb-4 bg-white border border-gray-200 rounded-2xl shadow-2xl z-20 max-h-96 overflow-hidden animate-in slide-in-from-top-2 duration-200"
                    >
                      {/* Search Header removed as requested */}

                      {/* Lecturer List */}
                      <div className="max-h-72 overflow-y-auto thin-scrollbar">
                        {loadingLecturers ? (
                          <div className="p-6 text-center text-gray-500">
                            <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                            <p className="text-sm font-medium">
                              Đang tải danh sách giảng viên...
                            </p>
                          </div>
                        ) : errorLecturers ? (
                          <div className="p-6 text-center text-red-500">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg
                                className="w-6 h-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <p className="text-sm font-medium">
                              {errorLecturers}
                            </p>
                          </div>
                        ) : filteredLecturers.length > 0 ? (
                          <>
                            {/* First 8 results always visible */}
                            {filteredLecturers.slice(0, 8).map((l) => (
                              <div
                                key={l.id}
                                className={`flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-b border-gray-100 last:border-b-0 group ${
                                  form.giangVien?.id === l.id
                                    ? "bg-gradient-to-r from-blue-100 to-indigo-100"
                                    : ""
                                }`}
                                onClick={() => handleLecturerSelect(l)}
                              >
                                <img
                                  src={l.avatar}
                                  alt={l.name}
                                  className="w-10 h-10 rounded-full object-cover bg-gray-200 flex-shrink-0 ring-2 ring-white group-hover:ring-blue-200 transition-all duration-200"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-900 transition-colors duration-200">
                                    {l.name}
                                  </div>
                                  <div className="text-gray-600 text-xs truncate">
                                    {l.email}
                                  </div>
                                  <div className="text-gray-500 text-xs truncate">
                                    {departmentMapping[l.department] ||
                                      l.department}{" "}
                                    • {l.specialization}
                                  </div>
                                </div>
                                <span
                                  className={`text-xs font-bold rounded-lg px-3 py-1.5 flex-shrink-0 transition-all duration-200 ${
                                    l.remainingSlots > 0
                                      ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800"
                                      : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800"
                                  }`}
                                >
                                  {l.remainingSlots === 0
                                    ? "Đã đủ"
                                    : `Còn ${l.remainingSlots} chỗ`}
                                </span>
                              </div>
                            ))}

                            {/* Show more results if available */}
                            {filteredLecturers.length > 8 && (
                              <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-blue-50">
                                <div className="text-center text-sm font-medium text-gray-700 mb-1">
                                  Hiển thị 8/{filteredLecturers.length} kết quả
                                </div>
                                <div className="text-center text-xs text-gray-500">
                                  💡 Gõ thêm để tìm chính xác hơn
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="p-6 text-center text-gray-500">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <p className="text-sm font-medium">
                              {searchQuery
                                ? "Không tìm thấy giảng viên"
                                : "Không có giảng viên nào"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer removed as requested */}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 pb-6">
                <button
                  type="submit"
                  className="w-full text-white border-none rounded-xl py-4 text-base font-bold cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] hover:opacity-90"
                  style={{
                    background:
                      "linear-gradient(135deg, #ea580c 0%, #fb923c 100%)",
                  }}
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Đang gửi đề xuất...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
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
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      <span>Gửi đề xuất</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Loading state */}
          {periodLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              </div>
              <p className="text-gray-600 font-medium">
                Đang kiểm tra đợt đăng ký...
              </p>
            </div>
          )}
        </div>

        {/* Lecturer Preview Card */}
        <div className="lg:flex-[0.8] bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-3xl shadow-lg p-6 lg:p-8 mt-0 lg:mt-0 h-fit lg:self-start flex flex-col gap-6 min-w-0 lg:max-w-80 lg:sticky lg:top-6 border border-blue-100/50">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl mb-3 shadow-md">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-blue-900 text-lg mb-1">
              Giảng viên đã chọn
            </h3>
            <p className="text-gray-600 text-sm">
              Thông tin giảng viên hướng dẫn
            </p>
          </div>

          {form.giangVien ? (
            <div className="flex flex-col items-center gap-4 bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
              <div className="relative">
                <img
                  src={form.giangVien.avatar}
                  alt={form.giangVien.name}
                  className="w-20 h-20 rounded-full object-cover bg-gray-200 ring-4 ring-blue-100 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900 text-lg mb-1">
                  {form.giangVien.name}
                </div>
                <div className="text-gray-600 text-sm mb-2">
                  {form.giangVien.email}
                </div>
                <div className="text-blue-600 text-sm font-semibold mb-1">
                  {form.giangVien.specialization}
                </div>
                <div className="text-gray-700 text-sm mb-3">
                  {departmentMapping[form.giangVien.department] ||
                    form.giangVien.department}
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold rounded-lg px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
                  Còn nhận sinh viên
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-2xl bg-white text-gray-400 gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Chưa chọn giảng viên
                </p>
                <p className="text-xs text-gray-400">
                  Tìm kiếm và chọn giảng viên hướng dẫn
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ThesisRegisterModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedPeriod: PropTypes.object,
};

export default ThesisRegisterModal;
