import React, { useState } from "react";
import "../../styles/pages/admin/style.css";
import PropTypes from "prop-types";

const AddTopicModal = ({ open, onClose, onSubmit, supervisorList = [] }) => {
  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    supervisor: "",
    maxStudent: "",
    status: "pending",
  });

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-box"
        style={{
          borderRadius: 16,
          padding: 32,
          minWidth: 380,
          maxWidth: 540,
          width: "98vw",
          boxShadow: "0 8px 32px rgba(44,65,115,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
            borderBottom: "1px solid #e0e6ed",
            paddingBottom: 16,
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
            Create New Topic
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
        <form
          className="modal-form"
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <label
            className="modal-label"
            style={{ fontWeight: 500, color: "#222b45", marginBottom: 2 }}
          >
            Topic Code
            <input
              className="modal-input"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="Enter topic code"
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
            Title
            <input
              className="modal-input"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter topic title"
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
            Description
            <textarea
              className="modal-input"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter topic description"
              rows={3}
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
            Supervisor
            <select
              className="modal-input"
              name="supervisor"
              value={form.supervisor}
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
              <option value="">Select supervisor</option>
              {supervisorList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label
            className="modal-label"
            style={{ fontWeight: 500, color: "#222b45", marginBottom: 2 }}
          >
            Maximum Student Count
            <input
              className="modal-input"
              name="maxStudent"
              value={form.maxStudent}
              onChange={handleChange}
              placeholder="Enter maximum student count"
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
            Status
            <select
              className="modal-input"
              name="status"
              value={form.status}
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
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
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
              onClick={onClose}
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
              Cancel
            </button>
            <button
              type="button"
              className="modal-btn create"
              style={{
                background: "#ff6600",
                color: "#fff",
                borderRadius: 8,
                fontSize: "1rem",
                fontWeight: 500,
                padding: "9px 22px",
                border: "none",
                cursor: "pointer",
                transition: "background 0.18s, color 0.18s",
                minWidth: 120,
                width: "auto",
              }}
            >
              Create Topic
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
  supervisorList: PropTypes.array,
};

export default AddTopicModal;
