import React, { useState, useEffect } from "react";
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

const AddAssignmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  topicData,
  studentProfiles,
}) => {
  const [formData, setFormData] = useState({
    topicId: null,
    assignedTo: "",
    title: "",
    description: "",
    dueDate: "",
    priority: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  // Reset form khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        topicId: null,
        assignedTo: "",
        title: "",
        description: "",
        dueDate: "",
        priority: 1,
      });
    }
  }, [isOpen]);

  // Set form data khi topicData thay đổi
  useEffect(() => {
    if (isOpen && topicData) {
      setFormData((prev) => ({
        ...prev,
        topicId: topicData.id || null,
        assignedTo: topicData.suggestedBy || "",
      }));
    }
  }, [topicData, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.topicId || !formData.title) {
      showToast("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    // Validate ngày hạn chót
    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      showToast("Ngày hạn chót không được nhỏ hơn ngày hiện tại!");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        topicId: formData.topicId,
        assignedTo: formData.assignedTo,
        title: formData.title?.trim(),
        description: formData.description?.trim(),
        dueDate: formData.dueDate || null,
        priority: formData.priority === "" ? null : Number(formData.priority),
      };

      await onSubmit(payload);

      // Reset form
      setFormData({
        topicId: null,
        assignedTo: "",
        title: "",
        description: "",
        dueDate: "",
        priority: 1,
      });

      showToast("Tạo assignment thành công!");
      onClose();
    } catch (error) {
      console.error("Lỗi khi tạo assignment:", error);
      showToast("Có lỗi xảy ra khi tạo assignment!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      topicId: null,
      assignedTo: "",
      title: "",
      description: "",
      dueDate: "",
      priority: 1,
    });
    onClose();
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
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900 m-0">
            Thêm nhiệm vụ mới
          </h2>
        </div>

        {/* Form */}
        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
          {/* Hidden Topic ID - provided automatically */}
          <input
            type="hidden"
            id="topicId"
            value={formData.topicId || ""}
            readOnly
          />

          {/* Title */}
          <div className="relative">
            <input
              id="title"
              type="text"
              placeholder=" "
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white peer min-h-[44px]"
            />
            <label
              htmlFor="title"
              className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-secondary peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
            >
              Tiêu đề <span className="text-red-600">*</span>
            </label>
          </div>

          {/* Description */}
          <div className="relative">
            <textarea
              id="description"
              placeholder=" "
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white resize-y peer min-h-[44px]"
            />
            <label
              htmlFor="description"
              className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-secondary peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
            >
              Mô tả
            </label>
          </div>

          {/* Row: Due date + Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <input
                id="dueDate"
                type="date"
                placeholder=" "
                value={formData.dueDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white peer min-h-[44px]"
              />
              <label
                htmlFor="dueDate"
                className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-secondary peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
              >
                Hạn chót
              </label>
              {formData.dueDate && new Date(formData.dueDate) < new Date() && (
                <p className="text-red-500 text-xs mt-1">
                  Ngày hạn chót không được nhỏ hơn ngày hiện tại
                </p>
              )}
            </div>

            <div className="relative">
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white min-h-[44px]"
              >
                <option value={1}>Thấp</option>
                <option value={2}>Trung bình</option>
                <option value={3}>Cao</option>
              </select>
              <label
                htmlFor="priority"
                className="absolute -top-2 left-3 bg-white px-1.5 text-sm font-semibold text-secondary z-10"
              >
                Mức ưu tiên
              </label>
            </div>
          </div>

          {/* Assigned to (read-only) */}
          <div className="relative">
            <input
              id="assignedTo"
              type="text"
              placeholder=" "
              value={(() => {
                const profile = formData.assignedTo
                  ? studentProfiles[formData.assignedTo]
                  : null;
                return profile?.fullName || "Sinh viên";
              })()}
              readOnly
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 bg-gray-50 peer min-h-[44px]"
            />
            <label
              htmlFor="assignedTo"
              className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-secondary peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
            >
              Giao cho (Sinh viên đăng ký)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 text-base font-medium text-gray-600 bg-gray-100 rounded-lg border-none cursor-pointer transition-all duration-200 hover:bg-gray-200 hover:text-gray-700 min-w-[100px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2.5 text-base font-medium text-white rounded-lg border-none cursor-pointer transition-all duration-200 shadow-sm hover:opacity-90 min-w-[120px] ${
                submitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
              style={{
                background: submitting
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #ea580c 0%, #fb923c 100%)",
              }}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang tạo...
                </span>
              ) : (
                "Tạo assignment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssignmentModal;
