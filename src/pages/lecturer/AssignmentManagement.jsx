import React, { useState } from "react";

const AssignmentManagement = () => {
  const [selectedThesis, setSelectedThesis] = useState(0);
  const [selectedAssignment, setSelectedAssignment] = useState(0);
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Sample data for thesis topics that lecturer has accepted
  const thesisTopics = [
    {
      id: 1,
      title: "Nghiên cứu và phát triển hệ thống quản lý sinh viên sử dụng AI",
      description:
        "Xây dựng hệ thống quản lý sinh viên thông minh với các tính năng AI như nhận diện khuôn mặt, phân tích hành vi học tập, và dự đoán kết quả học tập.",
      student: "Nguyễn Văn A",
      studentId: "SV001",
      status: "Accepted",
      startDate: "2024-01-15",
      endDate: "2024-06-15",
      assignments: [
        {
          id: 1,
          title: "Phân tích yêu cầu và thiết kế hệ thống",
          description:
            "Phân tích chi tiết yêu cầu từ người dùng và thiết kế kiến trúc hệ thống",
          dueDate: "2024-02-15",
          progress: 85,
          tasks: [
            {
              id: 1,
              name: "Thu thập yêu cầu từ giảng viên và sinh viên",
              assignee: "Nguyễn Văn A",
              progress: 100,
              deadline: "2024-01-25",
              status: "Completed",
            },
            {
              id: 2,
              name: "Phân tích yêu cầu chức năng",
              assignee: "Nguyễn Văn A",
              progress: 80,
              deadline: "2024-02-05",
              status: "On Track",
            },
            {
              id: 3,
              name: "Thiết kế kiến trúc hệ thống",
              assignee: "Nguyễn Văn A",
              progress: 70,
              deadline: "2024-02-15",
              status: "On Track",
            },
          ],
        },
        {
          id: 2,
          title: "Phát triển giao diện người dùng",
          description:
            "Xây dựng giao diện web responsive và thân thiện với người dùng",
          dueDate: "2024-03-15",
          progress: 45,
          tasks: [
            {
              id: 4,
              name: "Thiết kế wireframe và mockup",
              assignee: "Nguyễn Văn A",
              progress: 100,
              deadline: "2024-02-20",
              status: "Completed",
            },
            {
              id: 5,
              name: "Phát triển giao diện đăng nhập",
              assignee: "Nguyễn Văn A",
              progress: 60,
              deadline: "2024-03-01",
              status: "On Track",
            },
            {
              id: 6,
              name: "Phát triển dashboard chính",
              assignee: "Nguyễn Văn A",
              progress: 30,
              deadline: "2024-03-15",
              status: "On Track",
            },
          ],
        },
      ],
    },
    {
      id: 2,
      title: "Xây dựng ứng dụng mobile quản lý tài chính cá nhân",
      description:
        "Phát triển ứng dụng mobile giúp người dùng quản lý thu chi, tiết kiệm và đầu tư một cách hiệu quả.",
      student: "Trần Thị B",
      studentId: "SV002",
      status: "Accepted",
      startDate: "2024-01-20",
      endDate: "2024-07-20",
      assignments: [
        {
          id: 3,
          title: "Nghiên cứu công nghệ và framework",
          description:
            "Tìm hiểu và lựa chọn công nghệ phù hợp cho ứng dụng mobile",
          dueDate: "2024-02-20",
          progress: 100,
          tasks: [
            {
              id: 7,
              name: "Nghiên cứu React Native vs Flutter",
              assignee: "Trần Thị B",
              progress: 100,
              deadline: "2024-02-01",
              status: "Completed",
            },
            {
              id: 8,
              name: "Lựa chọn database và backend",
              assignee: "Trần Thị B",
              progress: 100,
              deadline: "2024-02-20",
              status: "Completed",
            },
          ],
        },
        {
          id: 4,
          title: "Thiết kế cơ sở dữ liệu",
          description:
            "Thiết kế schema database cho ứng dụng quản lý tài chính",
          dueDate: "2024-03-20",
          progress: 75,
          tasks: [
            {
              id: 9,
              name: "Thiết kế ERD",
              assignee: "Trần Thị B",
              progress: 100,
              deadline: "2024-03-01",
              status: "Completed",
            },
            {
              id: 10,
              name: "Tạo database schema",
              assignee: "Trần Thị B",
              progress: 50,
              deadline: "2024-03-20",
              status: "On Track",
            },
          ],
        },
      ],
    },
    {
      id: 3,
      title: "Phát triển chatbot hỗ trợ học tập cho sinh viên",
      description:
        "Xây dựng chatbot AI giúp sinh viên tra cứu thông tin học tập, lịch thi và hỗ trợ giải đáp thắc mắc.",
      student: "Lê Văn C",
      studentId: "SV003",
      status: "Accepted",
      startDate: "2024-02-01",
      endDate: "2024-08-01",
      assignments: [
        {
          id: 5,
          title: "Nghiên cứu và tích hợp AI chatbot",
          description: "Tìm hiểu các công nghệ AI và tích hợp vào chatbot",
          dueDate: "2024-03-01",
          progress: 60,
          tasks: [
            {
              id: 11,
              name: "Nghiên cứu OpenAI API",
              assignee: "Lê Văn C",
              progress: 100,
              deadline: "2024-02-15",
              status: "Completed",
            },
            {
              id: 12,
              name: "Tích hợp ChatGPT vào chatbot",
              assignee: "Lê Văn C",
              progress: 40,
              deadline: "2024-03-01",
              status: "On Track",
            },
          ],
        },
      ],
    },
  ];

  const currentThesis = thesisTopics[selectedThesis];
  const currentAssignment = currentThesis?.assignments[selectedAssignment];

  const getStatusColor = (status) => {
    switch (status) {
      case "On Track":
        return "bg-success-50 text-success-700 border-success-200";
      case "Overdue":
        return "bg-error-50 text-error-700 border-error-200";
      case "Completed":
        return "bg-info-50 text-info-700 border-info-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "bg-success-500";
    if (progress >= 50) return "bg-warning-500";
    return "bg-error-500";
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
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Left Sidebar - Thesis Topics List */}
      <div className="w-full lg:w-80 xl:w-96 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4">
            Đề tài đã chấp nhận
          </h2>
        </div>

        <div className="flex-1 p-4 overflow-y-auto thin-scrollbar">
          {thesisTopics.map((thesis, index) => (
            <div
              key={thesis.id}
              className={`bg-gray-50 hover:bg-gray-100 rounded-xl p-4 mb-4 cursor-pointer transition-all duration-200 border-2 hover:-translate-y-1 hover:shadow-card ${
                selectedThesis === index
                  ? "bg-primary-50 border-primary-300 shadow-lg shadow-primary-200"
                  : "border-transparent"
              }`}
              onClick={() => {
                setSelectedThesis(index);
                setSelectedAssignment(0);
              }}
            >
              <h3 className="text-sm font-semibold text-secondary-800 mb-2 leading-tight line-clamp-2">
                {thesis.title}
              </h3>
              <div className="flex flex-col gap-1.5 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">👤</span>
                  <span className="text-xs text-gray-600">
                    {thesis.student} ({thesis.studentId})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">📅</span>
                  <span className="text-xs text-gray-600">
                    {thesis.startDate} - {thesis.endDate}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-success-100 text-success-700 px-2 py-1 rounded-full">
                  {thesis.status}
                </span>
                <span className="text-xs text-gray-500">
                  {thesis.assignments.length} assignments
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Panel - Assignments List */}
      <div className="w-full lg:w-80 xl:w-96 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        {currentThesis && (
          <>
            <div className="p-6 border-b border-gray-200 bg-white">
              <h3 className="text-lg font-semibold text-secondary-800 mb-2">
                Assignments
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {currentThesis.title}
              </p>
              <button
                className="w-full bg-primary-500 hover:bg-primary-600 text-white border-none rounded-lg py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200 shadow-card"
                onClick={handleNewAssignment}
              >
                + New Assignment
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto thin-scrollbar">
              {currentThesis.assignments.map((assignment, index) => (
                <div
                  key={assignment.id}
                  className={`bg-gray-50 hover:bg-gray-100 rounded-xl p-4 mb-4 cursor-pointer transition-all duration-200 border-2 hover:-translate-y-1 hover:shadow-card ${
                    selectedAssignment === index
                      ? "bg-info-50 border-info-300 shadow-lg shadow-info-200"
                      : "border-transparent"
                  }`}
                  onClick={() => setSelectedAssignment(index)}
                >
                  <h4 className="text-sm font-semibold text-secondary-800 mb-2 leading-tight">
                    {assignment.title}
                  </h4>
                  <p className="text-xs text-gray-600 mb-3 leading-relaxed line-clamp-2">
                    {assignment.description}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">
                      📅 {assignment.dueDate}
                    </span>
                    <span className="text-xs font-semibold text-gray-600">
                      {assignment.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getProgressColor(
                        assignment.progress
                      )}`}
                      style={{ width: `${assignment.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right Panel - Assignment Details & Tasks */}
      <div className="flex-1 bg-white p-8 overflow-y-auto thin-scrollbar">
        {currentAssignment && (
          <>
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 pb-5 border-b border-gray-200 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-secondary-800 leading-tight mb-2">
                  {currentAssignment.title}
                </h1>
                <p className="text-sm text-gray-600">
                  Đề tài: {currentThesis.title}
                </p>
              </div>
              <div className="flex gap-3 w-full lg:w-auto">
                <button
                  className="flex items-center gap-1.5 bg-info-500 hover:bg-info-600 text-white border-none rounded-md py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200"
                  onClick={handleEditAssignment}
                >
                  <span className="text-sm">✏️</span>
                  Edit
                </button>
                <button
                  className="flex items-center gap-1.5 bg-error-500 hover:bg-error-600 text-white border-none rounded-md py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200"
                  onClick={handleDeleteAssignment}
                >
                  <span className="text-sm">🗑️</span>
                  Delete
                </button>
              </div>
            </div>

            {/* Description Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4">
                Mô tả
              </h3>
              <p className="text-base text-gray-700 leading-relaxed mb-5">
                {currentAssignment.description}
              </p>
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">📅</span>
                  <span className="text-sm text-gray-700">
                    Deadline: {currentAssignment.dueDate}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">📊</span>
                  <span className="text-sm text-gray-700">
                    Tiến độ: {currentAssignment.progress}%
                  </span>
                </div>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 gap-4">
                <h3 className="text-lg font-semibold text-secondary-800">
                  Các công việc
                </h3>
                <button
                  className="bg-primary-500 hover:bg-primary-600 text-white border-none rounded-md py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200 shadow-card w-full sm:w-auto"
                  onClick={handleAddTask}
                >
                  + Thêm công việc
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {currentAssignment.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-gray-50 rounded-xl p-5 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-secondary-800 mb-1">
                          {task.name}
                        </h4>
                        <span className="text-sm text-gray-600">
                          Người thực hiện: {task.assignee}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 cursor-pointer p-1">
                        ▼
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getProgressColor(
                            task.progress
                          )}`}
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-600 min-w-[40px] text-right">
                        {task.progress}%
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="text-xs text-gray-600">
                        Deadline: {task.deadline}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(
                          task.status
                        )}`}
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

      {/* Modals */}
      {showNewAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 min-w-[320px] max-w-[500px] w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-secondary-800 mb-4">
              Thêm Assignment mới
            </h3>
            {/* Modal content would go here */}
            <button
              className="w-full bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200"
              onClick={() => setShowNewAssignmentModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 min-w-[320px] max-w-[500px] w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-secondary-800 mb-4">
              Thêm công việc mới
            </h3>
            {/* Modal content would go here */}
            <button
              className="w-full bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200"
              onClick={() => setShowAddTaskModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;
