import React, { useState, useEffect } from "react";
import "../../styles/pages/admin/style.css";
import PropTypes from "prop-types";
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
    <>
      <style>
        {`
          .modal-box::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <div className="modal-overlay">
        <div
          className="modal-box"
          style={{
            borderRadius: 16,
            padding: 0,
            minWidth: 480,
            maxWidth: 640,
            width: "98vw",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 8px 32px rgba(44,65,115,0.18)",
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE/Edge
          }}
        >
          {/* Header cố định */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "32px 32px 16px 32px",
              borderBottom: "1px solid #e0e6ed",
              background: "#fff",
              borderRadius: "16px 16px 0 0",
            }}
          >
            <div
              className="modal-title"
              style={{
                fontSize: "1.18rem",
                fontWeight: 600,
                marginBottom: 0,
                color: "#222b45",
              }}
            >
              Tạo Đề Tài Mới
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: 22,
                color: "#6b7a90",
                cursor: "pointer",
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Form có thể cuộn */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 32px 32px 32px",
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // IE/Edge
            }}
          >
            <style>
              {`
                .modal-form::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
            <form
              className="modal-form"
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <label
                className="modal-label"
                style={{ fontWeight: 500, color: "#222b45", marginBottom: 2 }}
              >
                Mã Đề Tài
                <input
                  className="modal-input"
                  name="topicCode"
                  value={form.topicCode}
                  onChange={handleChange}
                  placeholder="Nhập mã đề tài"
                  style={{
                    borderRadius: 8,
                    border: "1px solid #e0e6ed",
                    padding: "10px 12px",
                    fontSize: "1rem",
                    background: "#f6f8fb",
                    marginTop: 4,
                  }}
                />
              </label>
              <label
                className="modal-label"
                style={{ fontWeight: 500, color: "#222b45", marginBottom: 2 }}
              >
                Tiêu Đề Đề Tài
                <input
                  className="modal-input"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Nhập tiêu đề đề tài"
                  required
                  style={{
                    borderRadius: 8,
                    border: "1px solid #e0e6ed",
                    padding: "10px 12px",
                    fontSize: "1rem",
                    background: "#f6f8fb",
                    marginTop: 4,
                  }}
                />
              </label>
              <label
                className="modal-label"
                style={{ fontWeight: 500, color: "#222b45", marginBottom: 2 }}
              >
                Mô Tả Chi Tiết
                <textarea
                  className="modal-input"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Nhập mô tả chi tiết về đề tài"
                  rows={3}
                  required
                  style={{
                    borderRadius: 8,
                    border: "1px solid #e0e6ed",
                    padding: "10px 12px",
                    fontSize: "1rem",
                    background: "#f6f8fb",
                    marginTop: 4,
                    resize: "vertical",
                  }}
                />
              </label>
              <label
                className="modal-label"
                style={{ fontWeight: 500, color: "#222b45", marginBottom: 2 }}
              >
                Mục Tiêu
                <textarea
                  className="modal-input"
                  name="objectives"
                  value={form.objectives}
                  onChange={handleChange}
                  placeholder="Nhập các mục tiêu của đề tài"
                  rows={3}
                  required
                  style={{
                    borderRadius: 8,
                    border: "1px solid #e0e6ed",
                    padding: "10px 12px",
                    fontSize: "1rem",
                    background: "#f6f8fb",
                    marginTop: 4,
                    resize: "vertical",
                  }}
                />
              </label>
              <label
                className="modal-label"
                style={{ fontWeight: 500, color: "#222b45", marginBottom: 2 }}
              >
                Phương Pháp
                <textarea
                  className="modal-input"
                  name="methodology"
                  value={form.methodology}
                  onChange={handleChange}
                  placeholder="Nhập phương pháp nghiên cứu"
                  rows={3}
                  required
                  style={{
                    borderRadius: 8,
                    border: "1px solid #e0e6ed",
                    padding: "10px 12px",
                    fontSize: "1rem",
                    background: "#f6f8fb",
                    marginTop: 4,
                    resize: "vertical",
                  }}
                />
              </label>
              <label
                className="modal-label"
                style={{ fontWeight: 500, color: "#222b45", marginBottom: 2 }}
              >
                Kết Quả Mong Đợi
                <textarea
                  className="modal-input"
                  name="expectedOutcome"
                  value={form.expectedOutcome}
                  onChange={handleChange}
                  placeholder="Nhập kết quả mong đợi của đề tài"
                  rows={3}
                  required
                  style={{
                    borderRadius: 8,
                    border: "1px solid #e0e6ed",
                    padding: "10px 12px",
                    fontSize: "1rem",
                    background: "#f6f8fb",
                    marginTop: 4,
                    resize: "vertical",
                  }}
                />
              </label>
              <label
                className="modal-label"
                style={{ fontWeight: 500, color: "#222b45", marginBottom: 2 }}
              >
                Năm Học
                <select
                  className="modal-input"
                  name="academicYearId"
                  value={form.academicYearId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #e0e6ed",
                    padding: "10px 12px",
                    fontSize: "1rem",
                    background: loading ? "#f5f5f5" : "#fff",
                    marginTop: 4,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">
                    {loading ? "Đang tải..." : "Chọn năm học"}
                  </option>
                  {academicYearList.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </label>
              <label
                className="modal-label"
                style={{ fontWeight: 500, color: "#222b45", marginBottom: 2 }}
              >
                Số Sinh Viên Tối Đa
                <input
                  className="modal-input"
                  name="maxStudents"
                  value={form.maxStudents}
                  onChange={handleChange}
                  placeholder="Nhập số sinh viên tối đa"
                  type="number"
                  min={1}
                  required
                  style={{
                    borderRadius: 8,
                    border: "1px solid #e0e6ed",
                    padding: "10px 12px",
                    fontSize: "1rem",
                    background: "#f6f8fb",
                    marginTop: 4,
                  }}
                />
              </label>
              <label
                className="modal-label"
                style={{ fontWeight: 500, color: "#222b45", marginBottom: 2 }}
              >
                Mức Độ Khó
                <select
                  className="modal-input"
                  name="difficultyLevel"
                  value={form.difficultyLevel}
                  onChange={handleChange}
                  required
                  style={{
                    borderRadius: 8,
                    border: "1px solid #e0e6ed",
                    padding: "10px 12px",
                    fontSize: "1rem",
                    background: "#fff",
                    marginTop: 4,
                  }}
                >
                  <option value="EASY">Dễ</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HARD">Khó</option>
                </select>
              </label>
              <div
                className="modal-btn-row"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 18,
                }}
              >
                <button
                  type="button"
                  className="modal-btn cancel"
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
                  className="modal-btn create"
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
      </div>
    </>
  );
};

AddTopicModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
};

export default AddTopicModal;
