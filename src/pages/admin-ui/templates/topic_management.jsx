import React, { useState } from "react";
import AdminLayout from "../../../components/admin_layout";
import AddTopicModal from "../../../components/modals/add_topic_modal";
import "../../../styles/pages/admin/style.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const topics = [
  {
    code: "TOP001",
    title: "Machine Learning Applications in Healthcare",
    supervisor: "Dr. Sarah Johnson",
    studentCount: 12,
    status: "Pending",
  },
  {
    code: "TOP002",
    title: "Blockchain Technology in Supply Chain",
    supervisor: "Dr. Michael Chen",
    studentCount: 8,
    status: "Approved",
  },
  {
    code: "TOP003",
    title: "Sustainable Energy Systems",
    supervisor: "Dr. Emily Brown",
    studentCount: 15,
    status: "Rejected",
  },
  {
    code: "TOP004",
    title: "Artificial Intelligence in Education",
    supervisor: "Dr. James Wilson",
    studentCount: 10,
    status: "Pending",
  },
  {
    code: "TOP005",
    title: "Cybersecurity in IoT Networks",
    supervisor: "Dr. Lisa Anderson",
    studentCount: 6,
    status: "Approved",
  },
];

const statusClass = {
  Pending: "status-label pending",
  Approved: "status-label approved",
  Rejected: "status-label rejected",
};

const supervisorList = [
  "Dr. Sarah Johnson",
  "Dr. Michael Chen",
  "Dr. Emily Brown",
  "Dr. James Wilson",
  "Dr. Lisa Anderson",
];

const TopicManagement = () => {
  const [openModal, setOpenModal] = useState(false);

  const handleCreate = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);
  const handleSubmit = (data) => {
    // Xử lý thêm topic ở đây
    setOpenModal(false);
  };

  return (
    <AdminLayout welcomeText="Topic Management">
      <div className="topic-mgmt-card">
        <div className="topic-mgmt-filter-row">
          <input
            className="topic-mgmt-search"
            placeholder="Search by topic code, title, or supervisor"
          />
          <div className="topic-mgmt-filter-group">
            <button className="topic-mgmt-filter-btn">Status</button>
            <button className="topic-mgmt-filter-btn">Supervisor</button>
            <button className="topic-mgmt-filter-btn">Date Range</button>
            <button className="topic-mgmt-reset-btn">Reset Filters</button>
          </div>
        </div>
        <table className="topic-mgmt-table">
          <thead>
            <tr>
              <th>Topic Code</th>
              <th>Title</th>
              <th>Supervisor</th>
              <th>Student Count</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.code}>
                <td>{t.code}</td>
                <td>{t.title}</td>
                <td>{t.supervisor}</td>
                <td>{t.studentCount}</td>
                <td>
                  <span className={statusClass[t.status]}>{t.status}</span>
                </td>
                <td>
                  <span className="topic-mgmt-action" title="View">
                    <i className="bi bi-eye"></i>
                  </span>
                  <span className="topic-mgmt-action" title="Edit">
                    <i className="bi bi-pen"></i>
                  </span>
                  <span className="topic-mgmt-action" title="Delete">
                    <i className="bi bi-trash"></i>
                  </span>
                  {t.status === "Pending" && (
                    <span className="topic-mgmt-action approve" title="Approve">
                      Approve
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="topic-mgmt-footer-row">
          <span>Showing 1 to 5 of 12 entries</span>
          <div className="topic-mgmt-pagination">
            <button className="topic-mgmt-page-btn active">1</button>
            <button className="topic-mgmt-page-btn">2</button>
            <button className="topic-mgmt-page-btn">3</button>
          </div>
        </div>
        <button className="topic-mgmt-create-btn" onClick={handleCreate}>
          + Create New Topic
        </button>
      </div>
      <AddTopicModal
        open={openModal}
        onClose={handleClose}
        onSubmit={handleSubmit}
        supervisorList={supervisorList}
      />
    </AdminLayout>
  );
};

export default TopicManagement;
