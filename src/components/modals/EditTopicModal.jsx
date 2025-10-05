import React, { useState, useEffect } from "react";
import {
  updateStudentSuggestedTopic,
  getAllTeachers,
} from "../../services/suggest.service";
import { toast } from "react-toastify";

const EditTopicModal = ({ isOpen, onClose, topic, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    objectives: "",
    methodology: "",
    expectedOutcome: "",
    supervisorId: "",
    reason: "",
  });
  const [teachers, setTeachers] = useState([]);
  const [currentTeacherName, setCurrentTeacherName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && topic) {
      setFormData({
        title: topic.title || "",
        description: topic.description || "",
        objectives: topic.objectives || "",
        methodology: topic.methodology || "",
        expectedOutcome: topic.expectedOutcome || "",
        supervisorId: topic.suggestedFor || "",
        reason: topic.reason || "",
      });
      setErrors({});
    }
  }, [isOpen, topic]);

  useEffect(() => {
    if (isOpen) {
      loadTeachers();
    }
  }, [isOpen]);

  const loadTeachers = async () => {
    try {
      const response = await getAllTeachers();
      const list = response || [];
      setTeachers(list);
      // Map tên giảng viên hiện tại (khóa, không cho đổi)
      const found = list.find(
        (t) => String(t.userId) === String(formData.supervisorId)
      );
      if (found?.fullName) setCurrentTeacherName(found.fullName);
    } catch (error) {
      console.error("Lỗi khi tải danh sách giảng viên:", error);
      toast.error("Không thể tải danh sách giảng viên");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề đề tài là bắt buộc";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Mô tả đề tài là bắt buộc";
    }

    if (!formData.objectives.trim()) {
      newErrors.objectives = "Mục tiêu đề tài là bắt buộc";
    }

    if (!formData.methodology.trim()) {
      newErrors.methodology = "Phương pháp nghiên cứu là bắt buộc";
    }

    if (!formData.expectedOutcome.trim()) {
      newErrors.expectedOutcome = "Kết quả mong đợi là bắt buộc";
    }

    if (!formData.supervisorId) {
      newErrors.supervisorId = "Vui lòng chọn giảng viên hướng dẫn";
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Lý do đề xuất là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await updateStudentSuggestedTopic(topic.suggestedId, formData);
      toast.success("Cập nhật đề tài thành công");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Lỗi khi cập nhật đề tài:", error);
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật đề tài");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-none"
        style={{ scrollbarWidth: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 m-0">
            Chỉnh sửa đề tài
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 rounded-lg hover:bg-gray-100"
            aria-label="Đóng"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tiêu đề đề tài */}
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  id="edit-title"
                  type="text"
                  name="title"
                  placeholder=" "
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 text-base border-2 rounded-lg outline-none transition-all duration-200 bg-white peer ${
                    errors.title
                      ? "border-red-500"
                      : "border-gray-300 hover:border-gray-400 focus:border-secondary focus:shadow-focus"
                  }`}
                />
                <label
                  htmlFor="edit-title"
                  className="absolute top-3 left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
                >
                  Tiêu đề đề tài <span className="text-error-600">*</span>
                </label>
              </div>
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Mô tả đề tài */}
            <div className="md:col-span-2">
              <div className="relative">
                <textarea
                  id="edit-description"
                  name="description"
                  placeholder=" "
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-4 py-3 text-base border-2 rounded-lg outline-none transition-all duration-200 bg-white peer resize-none ${
                    errors.description
                      ? "border-red-500"
                      : "border-gray-300 hover:border-gray-400 focus:border-secondary focus:shadow-focus"
                  }`}
                />
                <label
                  htmlFor="edit-description"
                  className="absolute top-3 left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
                >
                  Mô tả đề tài <span className="text-error-600">*</span>
                </label>
              </div>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Mục tiêu đề tài */}
            <div className="md:col-span-2">
              <div className="relative">
                <textarea
                  id="edit-objectives"
                  name="objectives"
                  placeholder=" "
                  value={formData.objectives}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-4 py-3 text-base border-2 rounded-lg outline-none transition-all duration-200 bg-white peer resize-none ${
                    errors.objectives
                      ? "border-red-500"
                      : "border-gray-300 hover:border-gray-400 focus:border-secondary focus:shadow-focus"
                  }`}
                />
                <label
                  htmlFor="edit-objectives"
                  className="absolute top-3 left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
                >
                  Mục tiêu đề tài <span className="text-error-600">*</span>
                </label>
              </div>
              {errors.objectives && (
                <p className="mt-1 text-sm text-red-600">{errors.objectives}</p>
              )}
            </div>

            {/* Phương pháp nghiên cứu */}
            <div className="md:col-span-2">
              <div className="relative">
                <textarea
                  id="edit-methodology"
                  name="methodology"
                  placeholder=" "
                  value={formData.methodology}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-4 py-3 text-base border-2 rounded-lg outline-none transition-all duration-200 bg-white peer resize-none ${
                    errors.methodology
                      ? "border-red-500"
                      : "border-gray-300 hover:border-gray-400 focus:border-secondary focus:shadow-focus"
                  }`}
                />
                <label
                  htmlFor="edit-methodology"
                  className="absolute top-3 left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
                >
                  Phương pháp nghiên cứu{" "}
                  <span className="text-error-600">*</span>
                </label>
              </div>
              {errors.methodology && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.methodology}
                </p>
              )}
            </div>

            {/* Kết quả mong đợi */}
            <div className="md:col-span-2">
              <div className="relative">
                <textarea
                  id="edit-expected"
                  name="expectedOutcome"
                  placeholder=" "
                  value={formData.expectedOutcome}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-4 py-3 text-base border-2 rounded-lg outline-none transition-all duration-200 bg-white peer resize-none ${
                    errors.expectedOutcome
                      ? "border-red-500"
                      : "border-gray-300 hover:border-gray-400 focus:border-secondary focus:shadow-focus"
                  }`}
                />
                <label
                  htmlFor="edit-expected"
                  className="absolute top-3 left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
                >
                  Kết quả mong đợi <span className="text-error-600">*</span>
                </label>
              </div>
              {errors.expectedOutcome && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.expectedOutcome}
                </p>
              )}
            </div>

            {/* Giảng viên hướng dẫn (khóa - không cho chọn lại) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giảng viên hướng dẫn *
              </label>
              <input
                type="text"
                value={currentTeacherName || formData.supervisorId}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700 border-gray-300 cursor-not-allowed"
              />
              {/* Giữ supervisorId trong form nhưng không cho đổi */}
              <input
                type="hidden"
                name="supervisorId"
                value={formData.supervisorId}
              />
            </div>

            {/* Lý do đề xuất */}
            <div className="md:col-span-2">
              <div className="relative">
                <textarea
                  id="edit-reason"
                  name="reason"
                  placeholder=" "
                  value={formData.reason}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-4 py-3 text-base border-2 rounded-lg outline-none transition-all duration-200 bg-white peer resize-none ${
                    errors.reason
                      ? "border-red-500"
                      : "border-gray-300 hover:border-gray-400 focus:border-secondary focus:shadow-focus"
                  }`}
                />
                <label
                  htmlFor="edit-reason"
                  className="absolute top-3 left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-xs peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium"
                >
                  Lý do đề xuất <span className="text-error-600">*</span>
                </label>
              </div>
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 text-base font-medium text-white bg-primary-500 rounded-lg border-none cursor-pointer transition-all duration-200 ${
                loading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-primary-400"
              }`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang cập nhật...
                </span>
              ) : (
                "Cập nhật đề tài"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTopicModal;
