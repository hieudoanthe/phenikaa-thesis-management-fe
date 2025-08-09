import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Select from "react-select";
import academicYearService from "../../services/academic-year.service";
import topicService from "../../services/topic.service";

const AddTopicModal = ({ open, onClose, onSubmit }) => {
  // Form ban đầu
  const initialForm = {
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
          console.log("Năm học được chọn:", {
            id: selectedYear.id,
            name: selectedYear.name,
          });

          // Thêm thông tin năm học vào DTO nếu cần
          submitData.academicYear = {
            id: selectedYear.id,
            name: selectedYear.name,
          };
        } else {
          console.warn(
            "Không tìm thấy năm học với ID:",
            submitData.academicYearId
          );
        }
      } else {
        console.warn("Chưa chọn năm học");
      }

      console.log("Dữ liệu sẽ gửi lên server:", submitData);

      // Gọi API tạo topic
      const result = await topicService.createTopic(submitData);

      if (result.success) {
        console.log("Tạo topic thành công:", result.data);
        // Reset form về trạng thái ban đầu
        setForm(initialForm);
        // Gọi callback để thông báo thành công
        onSubmit?.(result);
        // Đóng modal
        onClose();
      } else {
        console.error("Lỗi tạo topic:", result.message);
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error("Lỗi không mong muốn:", error);
      alert("Có lỗi xảy ra khi tạo đề tài");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "70px", // Chiều cao navbar
        left: "280px", // Chiều rộng sidebar
        right: 0,
        bottom: 0,
        background: "#fff",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Header cố định - click để đóng */}
      <div
        onClick={onClose}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "24px 32px",
          borderBottom: "1px solid #e0e6ed",
          background: "#fff",
          flexShrink: 0,
          cursor: "pointer",
          transition: "background-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#f8fafc";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#fff";
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "#2d3748",
          }}
        >
          Tạo đề tài
        </h2>
      </div>

      {/* Form có thể cuộn */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 32px",
          background: "#f8fafc",
        }}
      >
        <style>{`.admin-modal-form::-webkit-scrollbar { display: none; }`}</style>
        <form
          className="admin-modal-form"
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          {/* Dòng 1: Mã đề tài + Tiêu đề đề tài */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <div className="admin-floating-input-group">
              <input
                id="topicCode"
                className="admin-modal-input"
                name="topicCode"
                value={form.topicCode}
                onChange={handleChange}
                placeholder=" "
                autoComplete="off"
                style={{ width: "100%" }}
              />
              <label htmlFor="topicCode" className="admin-floating-label">
                Mã đề tài *
              </label>
            </div>

            <div className="admin-floating-input-group">
              <input
                id="title"
                className="admin-modal-input"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder=" "
                required
                style={{ width: "100%" }}
              />
              <label htmlFor="title" className="admin-floating-label">
                Tiêu đề đề tài *
              </label>
            </div>
          </div>

          {/* Mô tả chi tiết - full width */}
          <div className="admin-floating-input-group">
            <textarea
              id="description"
              className="admin-modal-input"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder=" "
              rows={3}
              required
              style={{ width: "100%", resize: "none" }}
            />
            <label htmlFor="description" className="admin-floating-label">
              Mô tả chi tiết *
            </label>
          </div>

          {/* Dòng 2: Mục tiêu + Phương pháp */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <div className="admin-floating-input-group">
              <textarea
                id="objectives"
                className="admin-modal-input"
                name="objectives"
                value={form.objectives}
                onChange={handleChange}
                placeholder=" "
                rows={3}
                required
                style={{ width: "100%", resize: "none" }}
              />
              <label htmlFor="objectives" className="admin-floating-label">
                Mục tiêu *
              </label>
            </div>

            <div className="admin-floating-input-group">
              <textarea
                id="methodology"
                className="admin-modal-input"
                name="methodology"
                value={form.methodology}
                onChange={handleChange}
                placeholder=" "
                rows={3}
                required
                style={{ width: "100%", resize: "none" }}
              />
              <label htmlFor="methodology" className="admin-floating-label">
                Phương pháp *
              </label>
            </div>
          </div>

          {/* Kết quả mong đợi - full width */}
          <div className="admin-floating-input-group">
            <textarea
              id="expectedOutcome"
              className="admin-modal-input"
              name="expectedOutcome"
              value={form.expectedOutcome}
              onChange={handleChange}
              placeholder=" "
              rows={3}
              required
              style={{ width: "100%", resize: "none" }}
            />
            <label htmlFor="expectedOutcome" className="admin-floating-label">
              Kết quả mong đợi *
            </label>
          </div>

          {/* Dòng 3: Năm học + Số sinh viên + Mức độ khó */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 20,
            }}
          >
            <div style={{ position: "relative" }}>
              <label
                style={{
                  position: "absolute",
                  top: "-8px",
                  left: "12px",
                  background: "#f8fafc",
                  padding: "0 6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#ff6600",
                  zIndex: 1,
                }}
              >
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

            <div className="admin-floating-input-group">
              <input
                id="maxStudents"
                className="admin-modal-input"
                name="maxStudents"
                value={form.maxStudents}
                onChange={handleChange}
                placeholder=" "
                type="number"
                min={1}
                required
                style={{
                  width: "100%",
                  height: "50px",
                  padding: "0 18px",
                  fontSize: "16px",
                }}
              />
              <label htmlFor="maxStudents" className="admin-floating-label">
                Số sinh viên tối đa *
              </label>
            </div>

            <div style={{ position: "relative" }}>
              <label
                style={{
                  position: "absolute",
                  top: "-8px",
                  left: "12px",
                  background: "#f8fafc",
                  padding: "0 6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#ff6600",
                  zIndex: 1,
                }}
              >
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
          <div
            className="admin-modal-btn-row"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
            }}
          >
            <button
              type="button"
              className="admin-modal-btn cancel"
              onClick={() => {
                resetForm();
                onClose();
              }}
              style={{
                background: "#f6f8fb",
                color: "#6b7a90",
                borderRadius: 8,
                fontSize: "1rem",
                fontWeight: 500,
                padding: "9px 22px",
                border: "none",
                cursor: "pointer",
                transition: "background 0.18s, color 0.18s",
                minWidth: 100,
                width: "auto",
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="admin-modal-btn create"
              disabled={submitting}
              style={{
                background: submitting ? "#ccc" : "#ff6600",
                color: "#fff",
                borderRadius: 8,
                fontSize: "1rem",
                fontWeight: 500,
                padding: "9px 22px",
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "background 0.18s, color 0.18s",
                minWidth: 120,
                width: "auto",
              }}
            >
              {submitting ? "Đang tạo..." : "Tạo Đề Tài"}
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
};

export default AddTopicModal;
