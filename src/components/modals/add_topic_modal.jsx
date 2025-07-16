import React, { useState } from "react";
import "../../styles/pages/admin/style.css";

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
    onSubmit && onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">Create New Topic</div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="modal-label">
            Topic Code
            <input
              className="modal-input"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="Enter topic code"
              required
            />
          </label>
          <label className="modal-label">
            Title
            <input
              className="modal-input"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter topic title"
              required
            />
          </label>
          <label className="modal-label">
            Description
            <textarea
              className="modal-input"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter topic description"
              rows={2}
            />
          </label>
          <label className="modal-label">
            Supervisor
            <select
              className="modal-input"
              name="supervisor"
              value={form.supervisor}
              onChange={handleChange}
              required
            >
              <option value="">Select supervisor</option>
              {supervisorList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="modal-label">
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
            />
          </label>
          <label className="modal-label">
            Status
            <select
              className="modal-input"
              name="status"
              value={form.status}
              onChange={handleChange}
              required
            >
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
          <div className="modal-btn-row">
            <button
              type="button"
              className="modal-btn cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="modal-btn create">
              Create Topic
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTopicModal;
