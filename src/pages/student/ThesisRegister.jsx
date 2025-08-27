import React, { useState, useEffect, useRef } from "react";
import { suggestTopicForStudent } from "../../services/suggest.service";
import { userService } from "../../services";
import { toast } from "react-toastify";

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

const ThesisRegisterModal = ({ isOpen, onClose }) => {
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

  // Gọi API lấy danh sách giảng viên khi component mount
  useEffect(() => {
    const fetchLecturers = async () => {
      setLoadingLecturers(true);
      setErrorLecturers("");
      try {
        const response = await userService.getAllTeachers();

        // Chuyển đổi dữ liệu từ API sang format phù hợp với UI
        // Tổng chỉ tiêu giảng viên (cấu hình tạm thời ở FE, nên đưa về từ BE nếu có)
        const TOTAL_TEACHER_CAPACITY = 15;

        const formattedLecturers =
          response?.map((teacher) => {
            const max = Number.isFinite(teacher?.maxStudents)
              ? teacher.maxStudents
              : teacher?.maxStudents ?? 0;
            return {
              id: teacher.userId,
              name: teacher.fullName || "Chưa có tên",
              email: teacher.phoneNumber || "Chưa có thông tin liên lạc",
              avatar:
                teacher.avt ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  teacher.fullName || "GV"
                )}&background=random`,
              specialization: teacher.specialization || "Chưa có chuyên ngành",
              department: teacher.department || "Chưa có khoa",
              assigned: 0,
              max: max,
              accepted: Math.max(
                0,
                TOTAL_TEACHER_CAPACITY - (Number.isFinite(max) ? max : 0)
              ),
              status: max > 0 ? "Available" : "Unavailable",
            };
          }) || [];

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
  }, []);

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
      toast.success("Đề xuất đề tài thành công!");
      onClose && onClose();
    } catch (err) {
      const errorMessage = err.message || "Có lỗi xảy ra, vui lòng thử lại!";
      setError(errorMessage);
      toast.error(errorMessage);
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
      className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex flex-col lg:flex-row gap-6 mx-auto my-4 px-4 py-6 bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
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
        <div className="flex-1 lg:flex-[1.2] bg-white rounded-2xl p-6 lg:p-8 flex flex-col gap-4 min-w-0">
          <h2 className="text-xl lg:text-2xl font-bold text-blue-900 mb-2">
            Đề xuất đề tài khóa luận
          </h2>
          <p className="text-gray-600 text-sm lg:text-base mb-4">
            Vui lòng điền đầy đủ các trường bắt buộc bên dưới
          </p>

          {/* Notice Box */}
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 flex items-start gap-3 text-sm mb-4">
            <span>
              Bạn chỉ được đề xuất 1 đề tài tại một thời điểm. Hãy kiểm tra kỹ
              thông tin trước khi gửi.
            </span>
          </div>

          {/* Form Fields - Single Column Layout */}
          <div
            className={`space-y-4 mb-4 transition-all duration-300 ${
              showLecturerList ? "opacity-40" : "opacity-100"
            }`}
          >
            {/* Tên đề tài */}
            <div className="relative">
              <input
                id="tieuDe"
                type="text"
                name="tieuDe"
                placeholder=" "
                value={form.tieuDe}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 pt-6 text-sm border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-blue-900 focus:shadow-md bg-white peer"
              />
              <label
                htmlFor="tieuDe"
                className="absolute top-2.5 left-3 text-sm text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-blue-900 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
              >
                Tên đề tài <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Mô tả đề tài */}
            <div className="relative">
              <textarea
                id="moTa"
                name="moTa"
                placeholder=" "
                value={form.moTa}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 pt-6 text-sm border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-blue-900 focus:shadow-md bg-white peer resize-none"
                rows={3}
              />
              <label
                htmlFor="moTa"
                className="absolute top-2.5 left-3 text-sm text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-blue-900 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
              >
                Mô tả đề tài <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Mục tiêu */}
            <div className="relative">
              <textarea
                id="mucTieu"
                name="mucTieu"
                placeholder=" "
                value={form.mucTieu}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 pt-6 text-sm border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-blue-900 focus:shadow-md bg-white peer resize-none"
                rows={3}
              />
              <label
                htmlFor="mucTieu"
                className="absolute top-2.5 left-3 text-sm text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-blue-900 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
              >
                Mục tiêu <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Phương pháp thực hiện */}
            <div className="relative">
              <textarea
                id="phuongPhap"
                name="phuongPhap"
                placeholder=" "
                value={form.phuongPhap}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 pt-6 text-sm border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-blue-900 focus:shadow-md bg-white peer resize-none"
                rows={3}
              />
              <label
                htmlFor="phuongPhap"
                className="absolute top-2.5 left-3 text-sm text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-blue-900 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
              >
                Phương pháp thực hiện <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Kết quả dự kiến */}
            <div className="relative">
              <textarea
                id="ketQuaDuKien"
                name="ketQuaDuKien"
                placeholder=" "
                value={form.ketQuaDuKien}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 pt-6 text-sm border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-blue-900 focus:shadow-md bg-white peer resize-none"
                rows={3}
              />
              <label
                htmlFor="ketQuaDuKien"
                className="absolute top-2.5 left-3 text-sm text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-blue-900 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
              >
                Kết quả dự kiến <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Lý do đề xuất */}
            <div className="relative">
              <textarea
                id="lyDo"
                name="lyDo"
                placeholder=" "
                value={form.lyDo}
                onChange={handleChange}
                className="w-full px-3 py-2.5 pt-6 text-sm border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-blue-900 focus:shadow-md bg-white peer resize-none"
                required
                rows={3}
              />
              <label
                htmlFor="lyDo"
                className="absolute top-2.5 left-3 text-sm text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-blue-900 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
              >
                Lý do đề xuất <span className="text-red-500">*</span>
              </label>
            </div>
          </div>

          {/* Lecturer Autocomplete - Full Width */}
          <div className="relative mb-4">
            <div className="relative">
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
                className="w-full px-3 py-2.5 pt-6 text-sm border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-blue-900 focus:shadow-md bg-white peer"
              />
              <label
                htmlFor="lecturer-search"
                className="absolute top-2.5 left-3 text-sm text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-blue-900 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
              >
                Giảng viên hướng dẫn mong muốn{" "}
                <span className="text-red-500">*</span>
              </label>

              {/* Lecturer Dropdown */}
              {showLecturerList && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 right-0 bottom-full mb-6 bg-white border border-gray-300 rounded-lg shadow-xl z-20 max-h-96 overflow-hidden"
                >
                  {/* Search Header removed as requested */}

                  {/* Lecturer List */}
                  <div className="max-h-72 overflow-y-auto">
                    {loadingLecturers ? (
                      <div className="p-3 text-center text-gray-500">
                        <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm">
                          Đang tải danh sách giảng viên...
                        </span>
                      </div>
                    ) : errorLecturers ? (
                      <div className="p-3 text-center text-red-500 text-sm">
                        {errorLecturers}
                      </div>
                    ) : filteredLecturers.length > 0 ? (
                      <>
                        {/* First 8 results always visible */}
                        {filteredLecturers.slice(0, 8).map((l) => (
                          <div
                            key={l.id}
                            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors duration-150 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                              form.giangVien?.id === l.id ? "bg-blue-100" : ""
                            }`}
                            onClick={() => handleLecturerSelect(l)}
                          >
                            <img
                              src={l.avatar}
                              alt={l.name}
                              className="w-8 h-8 rounded-full object-cover bg-gray-200 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-blue-900 text-sm truncate">
                                {l.name}
                              </div>
                              <div className="text-gray-600 text-xs truncate">
                                {l.email}
                              </div>
                              <div className="text-gray-500 text-xs truncate">
                                {l.department} • {l.specialization}
                              </div>
                            </div>
                            <span
                              className={`text-xs font-semibold rounded-lg px-2 py-1 flex-shrink-0 ${
                                l.max > 0
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {l.max === 0
                                ? "Đã đủ"
                                : `Đã nhận (${l.accepted})`}
                            </span>
                          </div>
                        ))}

                        {/* Show more results if available */}
                        {filteredLecturers.length > 8 && (
                          <div className="border-t border-gray-200 p-3 bg-gray-50">
                            <div className="text-center text-xs text-gray-600">
                              Hiển thị 8/{filteredLecturers.length} kết quả
                            </div>
                            <div className="text-center text-xs text-gray-500 mt-1">
                              {filteredLecturers.length > 8 && (
                                <span>💡 Gõ thêm để tìm chính xác hơn</span>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-3 text-center text-gray-500 italic text-sm">
                        {searchQuery
                          ? "Không tìm thấy giảng viên"
                          : "Không có giảng viên nào"}
                      </div>
                    )}
                  </div>

                  {/* Footer removed as requested */}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-orange-500 text-white border-none rounded-lg py-3 text-base font-semibold mt-2 cursor-pointer transition-all duration-200 shadow-md hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "Gửi đề xuất"
            )}
          </button>
        </div>

        {/* Lecturer Preview Card */}
        <div className="lg:flex-[0.8] bg-gray-50 rounded-2xl shadow-md p-4 lg:p-6 mt-0 lg:mt-0 h-fit lg:self-start flex flex-col gap-4 min-w-0 lg:max-w-72 lg:sticky lg:top-6">
          <div className="font-bold text-blue-900 text-lg mb-2">
            Giảng viên đã chọn
          </div>

          {form.giangVien ? (
            <div className="flex flex-col items-center gap-3 bg-white rounded-xl shadow-sm p-4">
              <img
                src={form.giangVien.avatar}
                alt={form.giangVien.name}
                className="w-14 h-14 rounded-full object-cover bg-gray-200"
              />
              <div className="font-bold text-blue-900 text-base text-center">
                {form.giangVien.name}
              </div>
              <div className="text-gray-600 text-sm text-center">
                {form.giangVien.email}
              </div>
              <div className="text-orange-500 text-sm font-medium text-center">
                {form.giangVien.specialization}
              </div>
              <div className="text-blue-900 text-sm mb-1">
                {form.giangVien.department}
              </div>
              <span className="text-xs font-semibold rounded-lg px-3 py-1 bg-green-100 text-green-800">
                Còn nhận
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-xl bg-white text-gray-400 gap-2">
              <div className="mb-1">
                <svg width="40" height="40" fill="#d1d5db" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M12 14c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z" />
                </svg>
              </div>
              <div className="text-sm text-gray-400">Chưa chọn giảng viên</div>
            </div>
          )}
        </div>
        {/* Close Button */}
        <button
          type="button"
          className="absolute top-3 right-3 bg-white rounded-full p-2 shadow hover:bg-gray-100"
          onClick={onClose}
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ThesisRegisterModal;
