import React, { useState } from "react";
import "../../styles/pages/lecturer/assignment_management.css";

const AssignmentManagement = () => {
  const [selectedAssignment, setSelectedAssignment] = useState(0);
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Sample data for assignments
  const assignments = [
    {
      id: 1,
      title: "Research Paper Analysis",
      description:
        "Students are required to analyze and write a research paper on the impact of artificial intelligence in modern education systems. This assignment focuses on critical thinking and academic writing skills.",
      dueDate: "2024-03-15",
      group: "Computer Science Year 2",
      tasks: [
        {
          id: 1,
          name: "Literature Review",
          assignee: "Alice Johnson",
          progress: 85,
          deadline: "2024-03-01",
          status: "On Track",
        },
        {
          id: 2,
          name: "Methodology Planning",
          assignee: "Bob Smith",
          progress: 45,
          deadline: "2024-03-05",
          status: "Overdue",
        },
        {
          id: 3,
          name: "Draft Submission",
          assignee: "Carol White",
          progress: 0,
          deadline: "2024-03-10",
          status: "On Track",
        },
      ],
    },
    {
      id: 2,
      title: "Group Project Presentation",
      description:
        "Final presentation of the semester-long group project. Each group will present their findings and demonstrate their understanding of the course material.",
      dueDate: "2024-03-20",
      group: "Business Administration Year 3",
      tasks: [
        {
          id: 4,
          name: "Project Planning",
          assignee: "David Brown",
          progress: 100,
          deadline: "2024-02-28",
          status: "Completed",
        },
        {
          id: 5,
          name: "Data Collection",
          assignee: "Emma Davis",
          progress: 70,
          deadline: "2024-03-10",
          status: "On Track",
        },
      ],
    },
    {
      id: 3,
      title: "Mid-term Assessment",
      description:
        "Comprehensive assessment covering topics from the first half of the semester. Includes multiple choice questions and short answer responses.",
      dueDate: "2024-03-25",
      group: "Engineering Year 1",
      tasks: [
        {
          id: 6,
          name: "Study Guide Creation",
          assignee: "Frank Miller",
          progress: 60,
          deadline: "2024-03-15",
          status: "On Track",
        },
        {
          id: 7,
          name: "Practice Test",
          assignee: "Grace Wilson",
          progress: 30,
          deadline: "2024-03-20",
          status: "On Track",
        },
      ],
    },
  ];

  const currentAssignment = assignments[selectedAssignment];

  const getStatusColor = (status) => {
    switch (status) {
      case "On Track":
        return "green";
      case "Overdue":
        return "red";
      case "Completed":
        return "blue";
      default:
        return "gray";
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "#28a745";
    if (progress >= 50) return "#ffc107";
    return "#dc3545";
  };

  const handleNewAssignment = () => {
    setShowNewAssignmentModal(true);
  };

  const handleAddTask = () => {
    setShowAddTaskModal(true);
  };

  const handleEditAssignment = () => {
    // edit assignment
  };

  const handleDeleteAssignment = () => {
    // delete assignment
  };

  return (
    <div className="assignment-management">
      {/* Left Sidebar - Assignment List */}
      <div className="assignment-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Assignments</h2>
          <button className="new-assignment-btn" onClick={handleNewAssignment}>
            + New Assignment
          </button>
        </div>

        <div className="assignment-list">
          {assignments.map((assignment, index) => (
            <div
              key={assignment.id}
              className={`assignment-card ${
                selectedAssignment === index ? "selected" : ""
              }`}
              onClick={() => setSelectedAssignment(index)}
            >
              <h3 className="assignment-title">{assignment.title}</h3>
              <p className="assignment-description">
                {assignment.description.length > 80
                  ? `${assignment.description.substring(0, 80)}...`
                  : assignment.description}
              </p>
              <div className="assignment-meta">
                <div className="meta-item">
                  <span className="meta-icon">📅</span>
                  <span className="meta-text">{assignment.dueDate}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">👥</span>
                  <span className="meta-text">{assignment.group}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Assignment Details */}
      <div className="assignment-details">
        {currentAssignment && (
          <>
            {/* Header Section */}
            <div className="details-header">
              <h1 className="details-title">{currentAssignment.title}</h1>
              <div className="header-actions">
                <button className="edit-btn" onClick={handleEditAssignment}>
                  <span className="btn-icon">✏️</span>
                  Edit
                </button>
                <button className="delete-btn" onClick={handleDeleteAssignment}>
                  <span className="btn-icon">🗑️</span>
                  Delete
                </button>
              </div>
            </div>

            {/* Description Section */}
            <div className="description-section">
              <h3 className="section-title">Description</h3>
              <p className="description-text">
                {currentAssignment.description}
              </p>
              <div className="description-meta">
                <div className="meta-item">
                  <span className="meta-icon">📅</span>
                  <span className="meta-text">
                    Due: {currentAssignment.dueDate}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">👥</span>
                  <span className="meta-text">
                    Group: {currentAssignment.group}
                  </span>
                </div>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="tasks-section">
              <div className="tasks-header">
                <h3 className="section-title">Tasks</h3>
                <button className="add-task-btn" onClick={handleAddTask}>
                  + Add Task
                </button>
              </div>

              <div className="tasks-list">
                {currentAssignment.tasks.map((task) => (
                  <div key={task.id} className="task-item">
                    <div className="task-header">
                      <div className="task-info">
                        <h4 className="task-name">{task.name}</h4>
                        <span className="task-assignee">
                          Assigned to: {task.assignee}
                        </span>
                      </div>
                      <span className="task-dropdown">▼</span>
                    </div>

                    <div className="task-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${task.progress}%`,
                            backgroundColor: getProgressColor(task.progress),
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">{task.progress}%</span>
                    </div>

                    <div className="task-meta">
                      <span className="task-deadline">{task.deadline}</span>
                      <span
                        className={`task-status ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals would go here */}
      {showNewAssignmentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>New Assignment</h3>
            {/* Modal content would go here */}
            <button onClick={() => setShowNewAssignmentModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {showAddTaskModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Task</h3>
            {/* Modal content would go here */}
            <button onClick={() => setShowAddTaskModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;
