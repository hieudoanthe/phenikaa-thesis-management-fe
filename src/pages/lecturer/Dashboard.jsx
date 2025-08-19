import React, { useState } from "react";
import "../../styles/pages/lecturer/dasboard.css";

const LecturerDashboard = () => {
  const [activeTab, setActiveTab] = useState("submissions");

  // Sample data for dashboard
  const lecturerName = "Dr. Sarah Mitchell";
  const department = "Department of Computer Science";

  const summaryData = {
    supervisedTopics: {
      count: 12,
      label: "Supervised Topics",
      subtitle: "Active thesis topics",
      change: "+2 this semester",
      icon: "🎓",
    },
    groupsAssigned: {
      count: 8,
      label: "Groups Assigned",
      subtitle: "Student groups",
      change: "5 in progress, 3 completed",
      icon: "👥",
    },
    pendingEvaluations: {
      count: 4,
      label: "Pending Evaluations",
      subtitle: "Need review",
      change: "2 proposals, 2 final submissions",
      icon: "📋",
    },
  };

  const upcomingDefenses = [
    {
      date: "May 15",
      title: "Advanced AI Implementation",
      group: "Group 4",
      time: "10:00 AM",
    },
    {
      date: "May 18",
      title: "Blockchain Security Analysis",
      group: "Group 7",
      time: "2:00 PM",
    },
    {
      date: "May 22",
      title: "Machine Learning in Healthcare",
      group: "Group 2",
      time: "11:30 AM",
    },
  ];

  const recentSubmissions = [
    {
      title: "Database Optimization Proposal",
      group: "Group 5",
      status: "Pending Review",
      date: "May 12, 2024",
      statusColor: "orange",
    },
    {
      title: "AI Ethics Chapter 3",
      group: "Group 1",
      status: "Under Review",
      date: "May 11, 2024",
      statusColor: "orange",
    },
    {
      title: "Cloud Computing Final Draft",
      group: "Group 3",
      status: "Approved",
      date: "May 10, 2024",
      statusColor: "green",
    },
    {
      title: "Web Security Analysis",
      group: "Group 6",
      status: "Pending Review",
      date: "May 9, 2024",
      statusColor: "orange",
    },
  ];

  const quickActions = [
    {
      title: "Schedule Defense",
      description: "Set up new defense sessions",
      icon: "📅",
      action: "schedule",
    },
    {
      title: "Review Submission",
      description: "Evaluate student work",
      icon: "📝",
      action: "review",
    },
    {
      title: "Send Feedback",
      description: "Provide guidance to students",
      icon: "💬",
      action: "feedback",
    },
  ];

  // Generate calendar days
  const calendarDays = [];
  for (let i = 1; i <= 31; i++) {
    calendarDays.push(i);
  }

  const handleQuickAction = (action) => {
    // TODO: Implement corresponding actions
  };

  return (
    <div className="lecturer-dashboard">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="banner-content">
          <h1 className="welcome-title">Welcome back, {lecturerName}</h1>
          <p className="department-name">{department}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        {Object.entries(summaryData).map(([key, data]) => (
          <div key={key} className="summary-card">
            <div className="card-header">
              <span className="card-icon">{data.icon}</span>
            </div>
            <div className="card-content">
              <h3 className="card-number">{data.count}</h3>
              <p className="card-label">{data.label}</p>
              <p className="card-subtitle">{data.subtitle}</p>
              <p className="card-change">{data.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Column - Upcoming Defenses */}
        <div className="left-column">
          <div className="content-card">
            <div className="card-header">
              <h2 className="card-title">Upcoming Defenses</h2>
              <span className="header-icon">📅</span>
            </div>

            {/* Calendar widget */}
            <div className="calendar-widget">
              <div className="calendar-header">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>
              <div className="calendar-grid">
                {calendarDays.map((day) => (
                  <div
                    key={day}
                    className={`calendar-day ${
                      [15, 18, 22].includes(day) ? "highlighted" : ""
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Defenses List */}
            <div className="defenses-list">
              {upcomingDefenses.map((defense, index) => (
                <div key={index} className="defense-item">
                  <div className="defense-date">{defense.date}</div>
                  <div className="defense-info">
                    <div className="defense-title">{defense.title}</div>
                    <div className="defense-group">({defense.group})</div>
                  </div>
                  <div className="defense-time">
                    <span className="time-icon">🕐</span>
                    {defense.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Recent Submissions */}
        <div className="right-column">
          <div className="content-card">
            <div className="card-header">
              <h2 className="card-title">Recent Submissions</h2>
              <span className="header-icon">📄</span>
            </div>

            <div className="submissions-list">
              {recentSubmissions.map((submission, index) => (
                <div key={index} className="submission-item">
                  <div className="submission-info">
                    <div className="submission-title">{submission.title}</div>
                    <div className="submission-group">({submission.group})</div>
                  </div>
                  <div className="submission-meta">
                    <span
                      className={`submission-status ${submission.statusColor}`}
                    >
                      {submission.status}
                    </span>
                    <span className="submission-date">{submission.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="quick-action-card"
              onClick={() => handleQuickAction(action.action)}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-content">
                <h3 className="action-title">{action.title}</h3>
                <p className="action-description">{action.description}</p>
              </div>
              <div className="action-arrow">→</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
