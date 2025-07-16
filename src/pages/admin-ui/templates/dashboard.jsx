import React from "react";
import AdminLayout from "../../../components/admin_layout";
import "../../../styles/pages/admin/style.css";

const stats = [
  { label: "Total Projects", value: 186, icon: "📋" },
  { label: "Pending Approval", value: 24, icon: "⏰" },
  { label: "Active Students", value: 342, icon: "👥" },
  { label: "Upcoming Defenses", value: 12, icon: "📁" },
];

const barData = [45, 32, 24, 29];
const barLabels = ["Software", "AI", "Networking", "Security"];
const donutData = [2, 1, 1];
const donutLabels = ["Scheduled", "In Progress", "Completed"];
const donutColors = ["#23395d", "#ff6600", "#ccc"];

const defenses = [
  {
    date: "2024-02-15",
    title: "AI-Powered Healthcare System",
    room: "Room 301",
    members: "Dr. Smith, Dr. Johnson",
    status: "Scheduled",
  },
  {
    date: "2024-02-16",
    title: "Blockchain in Supply Chain",
    room: "Room 205",
    members: "Dr. Williams, Dr. Brown",
    status: "In Progress",
  },
  {
    date: "2024-02-17",
    title: "IoT Smart City Solutions",
    room: "Room 401",
    members: "Dr. Davis, Dr. Miller",
    status: "Completed",
  },
];

const statusClass = {
  Scheduled: "defense-status scheduled",
  "In Progress": "defense-status inprogress",
  Completed: "defense-status completed",
};

const Dashboard = () => (
  <AdminLayout>
    <div className="dashboard-stats-row">
      {stats.map((s) => (
        <div className="dashboard-stat-card" key={s.label}>
          <div className="stat-label">{s.label}</div>
          <div className="stat-value">{s.value}</div>
          <div className="stat-icon">{s.icon}</div>
        </div>
      ))}
    </div>
    <div className="dashboard-charts-row">
      <div className="dashboard-chart-box">
        <div className="chart-title">Topics by Major</div>
        <div className="bar-chart-modern">
          {barData.map((val, idx) => (
            <div className="bar-item-modern" key={barLabels[idx]}>
              <div
                className="bar-modern"
                style={{ height: `${val * 2}px` }}
              ></div>
              <div className="bar-label-modern">{barLabels[idx]}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="dashboard-chart-box">
        <div className="chart-title">Topic Status</div>
        <div className="donut-chart-modern">
          <svg width="120" height="120" viewBox="0 0 42 42">
            <circle
              cx="21"
              cy="21"
              r="15.91549431"
              fill="transparent"
              stroke="#eee"
              strokeWidth="4"
            />
            {/* Scheduled */}
            <circle
              cx="21"
              cy="21"
              r="15.91549431"
              fill="transparent"
              stroke={donutColors[0]}
              strokeWidth="4"
              strokeDasharray="33 67"
              strokeDashoffset="25"
            />
            {/* In Progress */}
            <circle
              cx="21"
              cy="21"
              r="15.91549431"
              fill="transparent"
              stroke={donutColors[1]}
              strokeWidth="4"
              strokeDasharray="17 83"
              strokeDashoffset="58"
            />
            {/* Completed */}
            <circle
              cx="21"
              cy="21"
              r="15.91549431"
              fill="transparent"
              stroke={donutColors[2]}
              strokeWidth="4"
              strokeDasharray="10 90"
              strokeDashoffset="75"
            />
          </svg>
        </div>
      </div>
    </div>
    <div className="dashboard-table-section">
      <div className="table-title">Upcoming Defenses</div>
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Topic Title</th>
            <th>Room</th>
            <th>Committee Members</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {defenses.map((d) => (
            <tr key={d.date + d.title}>
              <td>{d.date}</td>
              <td>{d.title}</td>
              <td>{d.room}</td>
              <td>{d.members}</td>
              <td>
                <span className={statusClass[d.status]}>{d.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="dashboard-add-btn">+</button>
    </div>
  </AdminLayout>
);

export default Dashboard;
