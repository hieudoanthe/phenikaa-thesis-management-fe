import React, { useState } from "react";
import { suggestTopicForStudent } from "../../services/suggest.service";

const lecturersMock = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    email: "sjohnson@university.edu",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    specialization: "Artificial Intelligence",
    assigned: 2,
    max: 5,
    status: "Available",
  },
  {
    id: 2,
    name: "Prof. Michael Chen",
    email: "m.chen@university.edu",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    specialization: "Data Science",
    assigned: 5,
    max: 5,
    status: "Full",
  },
];

const initialForm = {
  tieuDe: "",
  moTa: "",
  mucTieu: "",
  phuongPhap: "",
  ketQuaDuKien: "",
  giangVien: null, // sẽ lấy id khi submit
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

const ThesisRegister = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [timGiangVien, setTimGiangVien] = useState("");
  const [showLecturerList, setShowLecturerList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Xử lý thay đổi trường nhập liệu
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Chọn giảng viên
  const handleLecturerSelect = (giangVien) => {
    setForm((prev) => ({ ...prev, giangVien }));
    setShowLecturerList(false);
    setTimGiangVien(giangVien.name);
    setSearchQuery(""); // Reset search query
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
      setTimGiangVien("");
      setSearchQuery("");
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Lọc giảng viên theo tên hoặc email
  const filteredLecturers = lecturersMock.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mx-auto my-8 px-4">
      {/* Form Card */}
      <div className="flex-1 lg:flex-[1.2] bg-white rounded-2xl shadow-lg p-6 lg:p-8 flex flex-col gap-4 lg:gap-5 min-w-0">
        <h2 className="text-xl lg:text-2xl font-bold text-blue-900 mb-1">
          Đề xuất đề tài khóa luận
        </h2>
        <p className="text-gray-600 text-base mb-2">
          Vui lòng điền đầy đủ các trường bắt buộc bên dưới
        </p>

        {/* Notice Box */}
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 lg:p-4 flex items-start gap-3 text-sm lg:text-base mb-2">
          <span className="text-lg mt-0.5">⚠️</span>
          <span>
            Bạn chỉ được đề xuất 1 đề tài tại một thời điểm. Hãy kiểm tra kỹ
            thông tin trước khi gửi.
          </span>
        </div>

        {/* Form Fields */}
        {fields.map((f) => (
          <div className="relative mb-2" key={f.name}>
            {f.type === "textarea" ? (
              <textarea
                id={f.name}
                name={f.name}
                placeholder=" "
                value={form[f.name]}
                onChange={handleChange}
                required={f.required}
                className="w-full px-4 py-3 pt-5 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-blue-900 focus:shadow-lg bg-white peer resize-none"
                rows={4}
              />
            ) : (
              <input
                id={f.name}
                type={f.type}
                name={f.name}
                placeholder=" "
                value={form[f.name]}
                onChange={handleChange}
                required={f.required}
                className="w-full px-4 py-3 pt-5 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-blue-900 focus:shadow-lg bg-white peer"
              />
            )}
            <label
              htmlFor={f.name}
              className="absolute top-3 left-4 text-base text-blue-900 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-blue-900 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
            >
              {f.label}
            </label>
          </div>
        ))}

        {/* Lecturer Autocomplete */}
        <div className="relative mb-2">
          <div className="relative">
            <input
              id="lecturer-search"
              type="text"
              placeholder=" "
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowLecturerList(true);
              }}
              onFocus={() => setShowLecturerList(true)}
              className="w-full px-4 py-3 pt-5 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-blue-900 focus:shadow-lg bg-white peer"
            />
            <label
              htmlFor="lecturer-search"
              className="absolute top-3 left-4 text-base text-blue-900 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-blue-900 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
            >
              Giảng viên hướng dẫn mong muốn
            </label>

            {/* Lecturer Dropdown */}
            {showLecturerList && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredLecturers.map((l) => (
                  <div
                    key={l.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors duration-150 hover:bg-blue-50 ${
                      form.giangVien?.id === l.id ? "bg-blue-100" : ""
                    }`}
                    onClick={() => handleLecturerSelect(l)}
                  >
                    <img
                      src={l.avatar}
                      alt={l.name}
                      className="w-9 h-9 rounded-full object-cover bg-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-blue-900 text-base truncate">
                        {l.name}
                      </div>
                      <div className="text-gray-600 text-sm truncate">
                        {l.email}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold rounded-lg px-2.5 py-1 ${
                        l.status === "Available"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {l.status === "Available" ? "Còn nhận" : "Đã đủ"}
                    </span>
                  </div>
                ))}
                {filteredLecturers.length === 0 && (
                  <div className="p-3 text-center text-gray-500 italic">
                    Không tìm thấy giảng viên
                  </div>
                )}

                {/* Close button */}
                <div className="border-t border-gray-200 p-2">
                  <button
                    type="button"
                    onClick={() => setShowLecturerList(false)}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-1"
                  >
                    Đóng danh sách
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reason Field */}
        <div className="relative mb-2">
          <textarea
            id="lyDo"
            name="lyDo"
            placeholder=" "
            value={form.lyDo}
            onChange={handleChange}
            className="w-full px-4 py-3 pt-5 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-blue-900 focus:shadow-lg bg-white peer resize-none"
            required
            rows={3}
          />
          <label
            htmlFor="lyDo"
            className="absolute top-3 left-4 text-base text-blue-900 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-blue-900 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
          >
            Lý do đề xuất <span className="text-red-500">*</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-orange-500 text-white border-none rounded-lg py-4 text-lg font-semibold mt-3 cursor-pointer transition-all duration-200 shadow-md hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <span className="inline-block w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            "Gửi đề xuất"
          )}
        </button>

        {/* Success Message */}
        {success && (
          <div className="text-green-800 bg-green-100 rounded-lg py-3 text-center font-semibold mt-3 text-base">
            Đề xuất đề tài thành công!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg py-3 px-4 mt-3 text-center">
            {error}
          </div>
        )}
      </div>

      {/* Lecturer Preview Card */}
      <div className="lg:flex-[0.9] bg-gray-50 rounded-2xl shadow-md p-4 lg:p-6 mt-0 lg:mt-0 h-fit lg:self-start flex flex-col gap-4 lg:gap-5 min-w-0 lg:max-w-80 lg:sticky lg:top-8">
        <div className="font-bold text-blue-900 text-lg mb-2">
          Giảng viên đã chọn
        </div>

        {form.giangVien ? (
          <div className="flex flex-col items-center gap-2 bg-white rounded-xl shadow-sm p-4 lg:p-5">
            <img
              src={form.giangVien.avatar}
              alt={form.giangVien.name}
              className="w-16 h-16 rounded-full object-cover bg-gray-200 mb-1"
            />
            <div className="font-bold text-blue-900 text-lg text-center">
              {form.giangVien.name}
            </div>
            <div className="text-gray-600 text-base text-center">
              {form.giangVien.email}
            </div>
            <div className="text-orange-500 text-base font-medium text-center">
              {form.giangVien.specialization}
            </div>
            <div className="text-blue-900 text-base mb-1">
              {form.giangVien.assigned}/{form.giangVien.max} đề tài
            </div>
            <span
              className={`text-sm font-semibold rounded-lg px-3 py-1 ${
                form.giangVien.status === "Available"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {form.giangVien.status === "Available" ? "Còn nhận" : "Đã đủ"}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-gray-300 rounded-xl bg-white text-gray-400 gap-2">
            <div className="mb-1">
              <svg width="48" height="48" fill="#d1d5db" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M12 14c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z" />
              </svg>
            </div>
            <div className="text-base text-gray-400">Chưa chọn giảng viên</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThesisRegister;
