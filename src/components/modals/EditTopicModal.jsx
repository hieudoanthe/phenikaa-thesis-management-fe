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
      setTeachers(response || []);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Chỉnh sửa đề tài
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tiêu đề đề tài */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề đề tài *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nhập tiêu đề đề tài"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Mô tả đề tài */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả đề tài *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Mô tả chi tiết về đề tài"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Mục tiêu đề tài */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mục tiêu đề tài *
                </label>
                <textarea
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.objectives ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nêu rõ các mục tiêu cần đạt được"
                />
                {errors.objectives && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.objectives}
                  </p>
                )}
              </div>

              {/* Phương pháp nghiên cứu */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phương pháp nghiên cứu *
                </label>
                <textarea
                  name="methodology"
                  value={formData.methodology}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.methodology ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Mô tả phương pháp nghiên cứu sẽ sử dụng"
                />
                {errors.methodology && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.methodology}
                  </p>
                )}
              </div>

              {/* Kết quả mong đợi */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kết quả mong đợi *
                </label>
                <textarea
                  name="expectedOutcome"
                  value={formData.expectedOutcome}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.expectedOutcome
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Mô tả kết quả mong đợi của đề tài"
                />
                {errors.expectedOutcome && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.expectedOutcome}
                  </p>
                )}
              </div>

              {/* Giảng viên hướng dẫn */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giảng viên hướng dẫn *
                </label>
                <select
                  name="supervisorId"
                  value={formData.supervisorId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.supervisorId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Chọn giảng viên hướng dẫn</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.userId} value={teacher.userId}>
                      {teacher.fullName} - {teacher.department}
                    </option>
                  ))}
                </select>
                {errors.supervisorId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.supervisorId}
                  </p>
                )}
              </div>

              {/* Lý do đề xuất */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do đề xuất *
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.reason ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Giải thích lý do đề xuất đề tài này"
                />
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Đang cập nhật..." : "Cập nhật đề tài"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTopicModal;
