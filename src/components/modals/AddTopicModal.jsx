import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Select from "react-select";
import academicYearService from "../../services/academic-year.service";
import topicService from "../../services/topic.service";

const AddTopicModal = ({
  open,
  onClose,
  onSubmit,
  topicData,
  isViewMode = false,
}) => {
  // Form ban đầu
  const initialForm = {
    topicId: null,
    topicCode: "",
    title: "",
    description: "",
    objectives: "",
    methodology: "",
    expectedOutcome: "",
    academicYearId: "",
    maxStudents: "",
    difficultyLevel: "MEDIUM",
  };

  const [form, setForm] = useState(initialForm);

  const [academicYearList, setAcademicYearList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Options cho react-select
  const difficultyOptions = [
    { value: "EASY", label: "Dễ" },
    { value: "MEDIUM", label: "Trung bình" },
    { value: "HARD", label: "Khó" },
  ];

  // Load danh sách năm học khi modal mở
  useEffect(() => {
    if (open) {
      loadAcademicYearList();
    }
  }, [open]);

  // Load dữ liệu topic vào form khi ở chế độ xem
  useEffect(() => {
    if (open && isViewMode && topicData) {
      setForm({
        topicId: topicData.topicId || null,
        topicCode: topicData.topicCode || "",
        title: topicData.title || "",
        description: topicData.description || "",
        objectives: topicData.objectives || "",
        methodology: topicData.methodology || "",
        expectedOutcome: topicData.expectedOutcome || "",
        academicYearId: topicData.academicYearId || "",
        maxStudents: topicData.maxStudents || "",
        difficultyLevel: topicData.difficultyLevel || "MEDIUM",
      });
    }
  }, [open, isViewMode, topicData]);

  const loadAcademicYearList = async () => {
    setLoading(true);
    try {
      const result = await academicYearService.getAcademicYearList();
      if (result.success) {
        setAcademicYearList(result.data || []);
      } else {
        console.error("Lỗi khi tải danh sách năm học:", result.message);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách năm học:", error);
    } finally {
      setLoading(false);
    }
  };

  // Convert academic years to react-select options
  const academicYearOptions = academicYearList.map((year) => ({
    value: year.id,
    label: year.name,
  }));

  // Function để lấy thông tin chi tiết năm học từ API
  const getAcademicYearDetails = async (yearId, yearName) => {
    try {
      const result = await academicYearService.getAcademicYear(
        yearId,
        yearName
      );
      if (result.success) {
        return result.data;
      } else {
        console.error("Lỗi khi lấy thông tin năm học:", result.message);
        return null;
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin năm học:", error);
      return null;
    }
  };

  // Reset form khi modal đóng
  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Xử lý đặc biệt cho academicYearId - chuyển thành Integer
    if (name === "academicYearId") {
      setForm((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseInt(value, 10),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handler cho react-select
  const handleSelectChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    const value = selectedOption ? selectedOption.value : "";

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      // Chuẩn bị dữ liệu trước khi submit
      const submitData = {
        ...form,
        // Đảm bảo academicYearId là Integer
        academicYearId:
          form.academicYearId === "" ? null : parseInt(form.academicYearId, 10),
        // Đảm bảo maxStudents là Integer
        maxStudents:
          form.maxStudents === "" ? null : parseInt(form.maxStudents, 10),
      };

      // Lấy thông tin chi tiết của năm học được chọn
      if (submitData.academicYearId) {
        const selectedYear = academicYearList.find(
          (year) => year.id === submitData.academicYearId
        );

        if (selectedYear) {
          // Thêm thông tin năm học vào DTO nếu cần
          submitData.academicYear = {
            id: selectedYear.id,
            name: selectedYear.name,
          };
        } else {
        }
      } else {
      }

      let result;

      // Phân biệt giữa tạo mới và cập nhật
      if (isViewMode && form.topicId) {
        // Chế độ cập nhật - gọi API updateTopic
        result = await topicService.updateTopic(form.topicId, submitData);
        if (result.success) {
          alert("Cập nhật đề tài thành công!");
        } else {
          console.error("Lỗi cập nhật topic:", result.message);
          alert(`Lỗi cập nhật: ${result.message}`);
          return;
        }
      } else {
        // Chế độ tạo mới - gọi API createTopic
        result = await topicService.createTopic(submitData);
        if (result.success) {
          alert("Tạo đề tài thành công!");
        } else {
          console.error("Lỗi tạo topic:", result.message);
          alert(`Lỗi tạo mới: ${result.message}`);
          return;
        }
      }

      // Reset form về trạng thái ban đầu
      setForm(initialForm);
      // Gọi callback để thông báo thành công
      onSubmit?.(result);
      // Đóng modal
      onClose();
    } catch (error) {
      console.error("Lỗi không mong muốn:", error);
      alert("Có lỗi xảy ra khi tạo đề tài");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed top-[70px] left-64 right-0 bottom-0 bg-white z-[1000] flex flex-col scrollbar-hide">
      {/* Header cố định - click để đóng */}
      <div
        onClick={onClose}
        className="flex justify-center items-center p-6 border-b border-gray-200 bg-white flex-shrink-0 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
      >
        <h2 className="m-0 text-2xl font-semibold text-gray-800">
          {isViewMode ? "Xem chi tiết đề tài" : "Tạo đề tài"}
        </h2>
      </div>

      {/* Form có thể cuộn */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex-1 overflow-y-auto p-6 bg-gray-50"
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 max-w-4xl mx-auto"
        >
          {/* Dòng 1: Mã đề tài + Tiêu đề đề tài */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <input
                id="topicCode"
                name="topicCode"
                value={form.topicCode}
                onChange={handleChange}
                placeholder=" "
                autoComplete="off"
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-secondary focus:shadow-focus bg-white peer"
              />
              <label
                htmlFor="topicCode"
                className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-secondary peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
              >
                Mã đề tài *
              </label>
            </div>

            <div className="relative">
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder=" "
                required
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-secondary focus:shadow-focus bg-white peer"
              />
              <label
                htmlFor="title"
                className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-secondary peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
              >
                Tiêu đề đề tài *
              </label>
            </div>
          </div>

          {/* Mô tả chi tiết - full width */}
          <div className="relative">
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder=" "
              rows={3}
              required
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-secondary focus:shadow-focus bg-white resize-none peer"
            />
            <label
              htmlFor="description"
              className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-secondary peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
            >
              Mô tả chi tiết *
            </label>
          </div>

          {/* Dòng 2: Mục tiêu + Phương pháp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <textarea
                id="objectives"
                name="objectives"
                value={form.objectives}
                onChange={handleChange}
                placeholder=" "
                rows={3}
                required
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-secondary focus:shadow-focus bg-white resize-none peer"
              />
              <label
                htmlFor="objectives"
                className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-secondary peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
              >
                Mục tiêu *
              </label>
            </div>

            <div className="relative">
              <textarea
                id="methodology"
                name="methodology"
                value={form.methodology}
                onChange={handleChange}
                placeholder=" "
                rows={3}
                required
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-secondary focus:shadow-focus bg-white resize-none peer"
              />
              <label
                htmlFor="methodology"
                className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-secondary peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
              >
                Phương pháp *
              </label>
            </div>
          </div>

          {/* Kết quả mong đợi - full width */}
          <div className="relative">
            <textarea
              id="expectedOutcome"
              name="expectedOutcome"
              value={form.expectedOutcome}
              onChange={handleChange}
              placeholder=" "
              rows={3}
              required
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-secondary focus:shadow-focus bg-white resize-none peer"
            />
            <label
              htmlFor="expectedOutcome"
              className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-secondary peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
            >
              Kết quả mong đợi *
            </label>
          </div>

          {/* Dòng 3: Năm học + Số sinh viên + Mức độ khó */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-gray-50 px-1.5 text-sm font-semibold text-secondary z-10">
                Năm học *
              </label>
              <Select
                name="academicYearId"
                options={academicYearOptions}
                value={
                  academicYearOptions.find(
                    (option) => option.value === form.academicYearId
                  ) || null
                }
                onChange={(selectedOption) =>
                  handleSelectChange(selectedOption, { name: "academicYearId" })
                }
                placeholder={loading ? "Đang tải..." : "Chọn năm học"}
                isLoading={loading}
                isDisabled={loading}
                isClearable
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: "50px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: "#fff",
                    boxShadow: state.isFocused
                      ? "0 0 0 3px rgba(255, 102, 0, 0.1)"
                      : "none",
                    borderColor: state.isFocused ? "#ff6600" : "#e2e8f0",
                    "&:hover": {
                      borderColor: state.isFocused ? "#ff6600" : "#cbd5e1",
                    },
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: "8px 18px",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "#64748b",
                    opacity: 1,
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "#4a5568",
                    fontWeight: 400,
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#ff6600"
                      : state.isFocused
                      ? "#fff5f0"
                      : "#fff",
                    color: state.isSelected ? "#fff" : "#4a5568",
                    fontWeight: state.isSelected ? 500 : 400,
                    "&:hover": {
                      backgroundColor: state.isSelected ? "#ff6600" : "#fff5f0",
                      color: state.isSelected ? "#fff" : "#4a5568",
                    },
                  }),
                  menu: (base) => ({
                    ...base,
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  }),
                }}
              />
            </div>

            <div className="relative">
              <input
                id="maxStudents"
                name="maxStudents"
                value={form.maxStudents}
                onChange={handleChange}
                placeholder=" "
                type="number"
                min={1}
                required
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-secondary focus:shadow-focus bg-white peer"
              />
              <label
                htmlFor="maxStudents"
                className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-secondary peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
              >
                Số sinh viên tối đa *
              </label>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 bg-gray-50 px-1.5 text-sm font-semibold text-secondary z-10">
                Mức Độ Khó *
              </label>
              <Select
                name="difficultyLevel"
                options={difficultyOptions}
                value={
                  difficultyOptions.find(
                    (option) => option.value === form.difficultyLevel
                  ) || null
                }
                onChange={(selectedOption) =>
                  handleSelectChange(selectedOption, {
                    name: "difficultyLevel",
                  })
                }
                placeholder="Chọn mức độ khó"
                isClearable
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: "50px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: "#fff",
                    boxShadow: state.isFocused
                      ? "0 0 0 3px rgba(255, 102, 0, 0.1)"
                      : "none",
                    borderColor: state.isFocused ? "#ff6600" : "#e2e8f0",
                    "&:hover": {
                      borderColor: state.isFocused ? "#ff6600" : "#cbd5e1",
                    },
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: "8px 18px",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "#64748b",
                    opacity: 1,
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "#4a5568",
                    fontWeight: 400,
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#ff6600"
                      : state.isFocused
                      ? "#fff5f0"
                      : "#fff",
                    color: state.isSelected ? "#fff" : "#4a5568",
                    fontWeight: state.isSelected ? 500 : 400,
                    "&:hover": {
                      backgroundColor: state.isSelected ? "#ff6600" : "#fff5f0",
                      color: state.isSelected ? "#fff" : "#4a5568",
                    },
                  }),
                  menu: (base) => ({
                    ...base,
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  }),
                }}
              />
            </div>
          </div>
          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-6 py-2.5 text-base font-medium text-gray-600 bg-gray-100 rounded-lg border-none cursor-pointer transition-all duration-200 hover:bg-gray-200 hover:text-gray-700 min-w-[100px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-base font-medium text-white rounded-lg border-none cursor-pointer transition-all duration-200 shadow-sm hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed min-w-[120px]"
              style={{
                background: submitting
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #ea580c 0%, #fb923c 100%)",
              }}
            >
              {submitting
                ? isViewMode
                  ? "Đang cập nhật..."
                  : "Đang tạo..."
                : isViewMode
                ? "Cập Nhật Đề Tài"
                : "Tạo Đề Tài"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AddTopicModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  topicData: PropTypes.object,
  isViewMode: PropTypes.bool,
};

export default AddTopicModal;
